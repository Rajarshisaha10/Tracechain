// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SampleChain
 * @notice Permissioned registry for biological / scientific sample chain of custody.
 *
 *  - Tamper evidence : every handling event is appended to a per-sample history. Each record
 *                      carries the hash of the previous one (a hash chain anchored at the sample
 *                      id), so the full history is bound to a single `headHash` fingerprint.
 *  - Custody         : two-step transfers. The current custodian initiates, the recipient must
 *                      accept (stating whether the sample arrived intact) or reject. A sample
 *                      that arrives damaged is quarantined automatically.
 *  - Accountability  : every record stores the acting address and block time. Only onboarded,
 *                      active organizations can act, and what they can do depends on their type.
 *  - Privacy         : only hashes (consent form, pseudonymous subject reference, lab reports)
 *                      and short free text are stored. Never put personal data on-chain.
 *
 * Intended for a permissioned EVM network (Hyperledger Besu, Quorum, private Ethereum).
 */
contract SampleChain {
    // ------------------------------------------------------------------ types
    enum OrgType { None, Hospital, Laboratory, Research, Courier, Auditor }
    enum Status { None, Active, InTransit, Quarantined, Consumed, Destroyed }
    enum RecType {
        Collected,           // 0  dataHash = consent hash
        AliquotCreated,      // 1  on parent, dataHash = child id
        DerivedFrom,         // 2  on child,  dataHash = parent id
        TransferInitiated,   // 3  dataHash = recipient address
        TransferAccepted,    // 4  dataHash = 1 intact / 0 damaged
        TransferRejected,    // 5
        TransferCancelled,   // 6
        Storage,             // 7  temp = temperature x10 (deg C), note = location
        Handling,            // 8  dataHash = keccak256(action)
        Test,                // 9  dataHash = result/report hash
        Incident,            // 10 dataHash = evidence hash
        Quarantined,         // 11
        Released,            // 12
        Consumed,            // 13
        Destroyed,           // 14
        AdminReassigned      // 15 dataHash = new custodian address
    }

    struct Org {
        string name;
        OrgType orgType;
        bytes2 country;          // ISO 3166-1 alpha-2
        bool active;
        bytes32 accreditationHash;
        uint64 registeredAt;
    }

    struct Sample {
        bytes32 sampleId;
        string externalId;       // label / barcode, unique per creating organization
        string sampleType;       // e.g. "Whole blood", "Tissue biopsy"
        address origin;          // organization that originally collected the material
        address creator;         // organization that registered this record (differs for aliquots)
        uint64 collectedAt;
        bytes32 consentHash;     // hash of the consent document
        bytes32 subjectHash;     // hash of a pseudonymous subject reference
        bytes32 parentId;        // 0 unless this is an aliquot
        address custodian;
        address pendingRecipient;
        Status status;
        bytes32 headHash;        // hash-chain head over the whole history
    }

    struct Record {
        RecType recType;
        address actor;
        uint64 timestamp;
        bytes32 dataHash;
        int32 temp;              // NO_TEMP when not applicable
        string note;
        string uri;
        bytes32 prevHash;
        bytes32 recordHash;
    }

    struct NewSample {
        string externalId;
        string sampleType;
        uint64 collectedAt;
        bytes32 consentHash;
        bytes32 subjectHash;
        string note;
    }

    // ---------------------------------------------------------------- storage
    int32 public constant NO_TEMP = type(int32).min;

    address public admin;
    address public pendingAdmin;
    bool public paused;

    mapping(address => Org) private orgs;
    mapping(bytes32 => Sample) private samples;
    mapping(bytes32 => Record[]) private history;
    mapping(bytes32 => bytes32[]) private children;
    mapping(bytes32 => Status) private statusBeforeQuarantine;
    mapping(address => bytes32[]) private held;      // every sample an org has ever held (may repeat)
    mapping(address => bytes32[]) private incoming;  // every transfer ever offered to an org

    // ----------------------------------------------------------------- errors
    error NotAdmin();
    error NotPendingAdmin();
    error ContractPaused();
    error Unauthorized();
    error NotActiveOrg();
    error ZeroAddress();
    error AlreadyRegistered();
    error InvalidInput();
    error SampleExists();
    error SampleNotFound();
    error NotCustodian();
    error NotRecipient();
    error InvalidRecipient();
    error InvalidState(Status current);

    // ----------------------------------------------------------------- events
    event AdminTransferStarted(address indexed currentAdmin, address indexed pendingAdmin);
    event AdminTransferred(address indexed oldAdmin, address indexed newAdmin);
    event Paused(address indexed by);
    event Unpaused(address indexed by);
    event OrgRegistered(address indexed account, OrgType orgType, bytes2 country, string name);
    event OrgStatusChanged(address indexed account, bool active);
    event SampleRegistered(bytes32 indexed sampleId, address indexed creator, string externalId);
    event RecordAdded(bytes32 indexed sampleId, uint256 index, RecType indexed recType, address indexed actor, bytes32 recordHash);

    // -------------------------------------------------------------- modifiers
    modifier onlyAdmin() {
        if (msg.sender != admin) revert NotAdmin();
        _;
    }

    modifier whenNotPaused() {
        if (paused) revert ContractPaused();
        _;
    }

    constructor() {
        admin = msg.sender;
        emit AdminTransferred(address(0), msg.sender);
    }

    // ------------------------------------------------------------------ admin
    function transferAdmin(address newAdmin) external onlyAdmin {
        if (newAdmin == address(0)) revert ZeroAddress();
        pendingAdmin = newAdmin;
        emit AdminTransferStarted(admin, newAdmin);
    }

    function acceptAdmin() external {
        if (msg.sender != pendingAdmin) revert NotPendingAdmin();
        emit AdminTransferred(admin, msg.sender);
        admin = msg.sender;
        pendingAdmin = address(0);
    }

    function pause() external onlyAdmin { paused = true; emit Paused(msg.sender); }
    function unpause() external onlyAdmin { paused = false; emit Unpaused(msg.sender); }

    function registerOrg(
        address account,
        string calldata name,
        OrgType orgType,
        bytes2 country,
        bytes32 accreditationHash
    ) external onlyAdmin whenNotPaused {
        if (account == address(0)) revert ZeroAddress();
        if (orgType == OrgType.None || bytes(name).length == 0 || country == bytes2(0)) revert InvalidInput();
        if (orgs[account].orgType != OrgType.None) revert AlreadyRegistered();
        orgs[account] = Org(name, orgType, country, true, accreditationHash, uint64(block.timestamp));
        emit OrgRegistered(account, orgType, country, name);
    }

    function setOrgActive(address account, bool active) external onlyAdmin whenNotPaused {
        if (orgs[account].orgType == OrgType.None) revert InvalidInput();
        orgs[account].active = active;
        emit OrgStatusChanged(account, active);
    }

    /// @notice Recover custody when the holder is suspended or gone. Recorded permanently with a reason.
    function adminReassign(bytes32 id, address to, string calldata reason) external onlyAdmin whenNotPaused {
        Sample storage s = _sample(id);
        if (s.status == Status.Consumed || s.status == Status.Destroyed) revert InvalidState(s.status);
        Org storage r = orgs[to];
        if (!r.active || r.orgType == OrgType.Auditor) revert InvalidRecipient();
        s.custodian = to;
        s.pendingRecipient = address(0);
        if (s.status == Status.InTransit) s.status = Status.Active;
        held[to].push(id);
        _add(id, _rec(RecType.AdminReassigned, bytes32(uint256(uint160(to))), reason, ""));
    }

    // ---------------------------------------------------------------- samples
    function computeSampleId(address creator, string memory externalId) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(creator, externalId));
    }

    function registerSample(NewSample calldata p) external whenNotPaused returns (bytes32 id) {
        Org storage o = _activeOrg();
        if (!_isBioHandler(o.orgType)) revert Unauthorized();
        if (
            bytes(p.externalId).length == 0 || bytes(p.sampleType).length == 0 ||
            p.consentHash == bytes32(0) || p.collectedAt == 0 || p.collectedAt > block.timestamp
        ) revert InvalidInput();

        id = computeSampleId(msg.sender, p.externalId);
        Sample storage s = samples[id];
        if (s.status != Status.None) revert SampleExists();

        s.sampleId = id;
        s.externalId = p.externalId;
        s.sampleType = p.sampleType;
        s.origin = msg.sender;
        s.creator = msg.sender;
        s.collectedAt = p.collectedAt;
        s.consentHash = p.consentHash;
        s.subjectHash = p.subjectHash;
        s.custodian = msg.sender;
        s.status = Status.Active;
        s.headHash = id; // anchor of the hash chain
        held[msg.sender].push(id);

        _add(id, _rec(RecType.Collected, p.consentHash, p.note, ""));
        emit SampleRegistered(id, msg.sender, p.externalId);
    }

    /// @notice Split off a child sample (aliquot) from a sample you currently hold.
    function createAliquot(
        bytes32 parentId,
        string calldata externalId,
        string calldata sampleType,
        string calldata note
    ) external whenNotPaused returns (bytes32 childId) {
        Sample storage ps = _sample(parentId);
        _requireCustodian(ps);
        _requireStatus(ps, Status.Active);
        if (!_isBioHandler(orgs[msg.sender].orgType)) revert Unauthorized();
        if (bytes(externalId).length == 0 || bytes(sampleType).length == 0) revert InvalidInput();

        childId = computeSampleId(msg.sender, externalId);
        Sample storage cs = samples[childId];
        if (cs.status != Status.None) revert SampleExists();

        cs.sampleId = childId;
        cs.externalId = externalId;
        cs.sampleType = sampleType;
        cs.origin = ps.origin;
        cs.creator = msg.sender;
        cs.collectedAt = ps.collectedAt;
        cs.consentHash = ps.consentHash;
        cs.subjectHash = ps.subjectHash;
        cs.parentId = parentId;
        cs.custodian = msg.sender;
        cs.status = Status.Active;
        cs.headHash = childId;
        children[parentId].push(childId);
        held[msg.sender].push(childId);

        _add(parentId, _rec(RecType.AliquotCreated, childId, note, ""));
        _add(childId, _rec(RecType.DerivedFrom, parentId, note, ""));
        emit SampleRegistered(childId, msg.sender, externalId);
    }

    // ---------------------------------------------------------------- custody
    function initiateTransfer(bytes32 id, address to, string calldata note) external whenNotPaused {
        Sample storage s = _sample(id);
        _requireCustodian(s);
        _requireStatus(s, Status.Active);
        Org storage r = orgs[to];
        if (!r.active || to == msg.sender || r.orgType == OrgType.Auditor) revert InvalidRecipient();

        s.pendingRecipient = to;
        s.status = Status.InTransit;
        incoming[to].push(id);
        _add(id, _rec(RecType.TransferInitiated, bytes32(uint256(uint160(to))), note, ""));
    }

    /// @param intact false = the sample arrived damaged / out of spec; it is quarantined automatically.
    function acceptTransfer(bytes32 id, bool intact, string calldata note) external whenNotPaused {
        Sample storage s = _sample(id);
        if (s.status != Status.InTransit) revert InvalidState(s.status);
        if (s.pendingRecipient != msg.sender) revert NotRecipient();
        _activeOrg();

        s.custodian = msg.sender;
        s.pendingRecipient = address(0);
        s.status = Status.Active;
        held[msg.sender].push(id);
        _add(id, _rec(RecType.TransferAccepted, intact ? bytes32(uint256(1)) : bytes32(0), note, ""));

        if (!intact) _quarantine(s, id, "Received in unacceptable condition");
    }

    function rejectTransfer(bytes32 id, string calldata reason) external whenNotPaused {
        Sample storage s = _sample(id);
        if (s.status != Status.InTransit) revert InvalidState(s.status);
        if (s.pendingRecipient != msg.sender) revert NotRecipient();
        _activeOrg();

        s.pendingRecipient = address(0);
        s.status = Status.Active; // custody stays with the sender
        _add(id, _rec(RecType.TransferRejected, bytes32(0), reason, ""));
    }

    function cancelTransfer(bytes32 id, string calldata reason) external whenNotPaused {
        Sample storage s = _sample(id);
        _requireCustodian(s);
        _requireStatus(s, Status.InTransit);
        s.pendingRecipient = address(0);
        s.status = Status.Active;
        _add(id, _rec(RecType.TransferCancelled, bytes32(0), reason, ""));
    }

    // --------------------------------------------------------------- handling
    /// @param tempCx10 temperature in tenths of a degree Celsius (e.g. -800 = -80.0 C), or NO_TEMP.
    function logStorage(bytes32 id, string calldata location, int32 tempCx10, string calldata note) external whenNotPaused {
        Sample storage s = _sample(id);
        _requireCustodian(s);
        _requireLive(s);
        if (bytes(location).length == 0) revert InvalidInput();
        if (tempCx10 != NO_TEMP && (tempCx10 < -3000 || tempCx10 > 1500)) revert InvalidInput();

        Record memory r = _rec(
            RecType.Storage, bytes32(0),
            bytes(note).length == 0 ? location : string.concat(location, " | ", note), ""
        );
        r.temp = tempCx10;
        _add(id, r);
    }

    function logHandling(bytes32 id, string calldata action, string calldata note) external whenNotPaused {
        Sample storage s = _sample(id);
        _requireCustodian(s);
        _requireLive(s);
        if (bytes(action).length == 0) revert InvalidInput();
        _add(id, _rec(
            RecType.Handling, keccak256(bytes(action)),
            bytes(note).length == 0 ? action : string.concat(action, " | ", note), ""
        ));
    }

    /// @notice Record a test. `resultHash` is the hash of the lab report / data file, `uri` where it lives.
    function recordTest(bytes32 id, string calldata testName, bytes32 resultHash, string calldata uri) external whenNotPaused {
        Sample storage s = _sample(id);
        _requireCustodian(s);
        _requireStatus(s, Status.Active);
        OrgType t = orgs[msg.sender].orgType;
        if (t != OrgType.Laboratory && t != OrgType.Research) revert Unauthorized();
        if (bytes(testName).length == 0 || resultHash == bytes32(0)) revert InvalidInput();
        _add(id, _rec(RecType.Test, resultHash, testName, uri));
    }

    /// @notice Report an incident (e.g. temperature excursion). Custodian, the pending recipient, or an auditor.
    function logIncident(bytes32 id, string calldata description, bytes32 evidenceHash, string calldata uri) external whenNotPaused {
        Sample storage s = _sample(id);
        if (s.status == Status.Consumed || s.status == Status.Destroyed) revert InvalidState(s.status);
        Org storage o = _activeOrg();
        if (msg.sender != s.custodian && msg.sender != s.pendingRecipient && o.orgType != OrgType.Auditor) revert Unauthorized();
        if (bytes(description).length == 0) revert InvalidInput();
        _add(id, _rec(RecType.Incident, evidenceHash, description, uri));
    }

    // ------------------------------------------------------------- quarantine
    /// @notice Custodian, an auditor or the admin can put a sample on hold.
    function quarantine(bytes32 id, string calldata reason) external whenNotPaused {
        Sample storage s = _sample(id);
        if (s.status != Status.Active && s.status != Status.InTransit) revert InvalidState(s.status);
        if (msg.sender != admin) {
            Org storage o = _activeOrg();
            if (o.orgType != OrgType.Auditor && msg.sender != s.custodian) revert Unauthorized();
        }
        _quarantine(s, id, reason);
    }

    /// @notice Only an auditor or the admin can lift a quarantine.
    function release(bytes32 id, string calldata note) external whenNotPaused {
        Sample storage s = _sample(id);
        if (s.status != Status.Quarantined) revert InvalidState(s.status);
        if (msg.sender != admin) {
            if (orgs[msg.sender].orgType != OrgType.Auditor || !orgs[msg.sender].active) revert Unauthorized();
        }
        s.status = statusBeforeQuarantine[id];
        _add(id, _rec(RecType.Released, bytes32(0), note, ""));
    }

    // -------------------------------------------------------------- lifecycle
    function markConsumed(bytes32 id, string calldata reason) external whenNotPaused {
        Sample storage s = _sample(id);
        _requireCustodian(s);
        _requireStatus(s, Status.Active);
        OrgType t = orgs[msg.sender].orgType;
        if (t != OrgType.Laboratory && t != OrgType.Research) revert Unauthorized();
        s.status = Status.Consumed;
        _add(id, _rec(RecType.Consumed, bytes32(0), reason, ""));
    }

    function markDestroyed(bytes32 id, string calldata reason) external whenNotPaused {
        Sample storage s = _sample(id);
        _requireCustodian(s);
        if (s.status != Status.Active && s.status != Status.Quarantined) revert InvalidState(s.status);
        if (!_isBioHandler(orgs[msg.sender].orgType)) revert Unauthorized();
        s.status = Status.Destroyed;
        _add(id, _rec(RecType.Destroyed, bytes32(0), reason, ""));
    }

    // ------------------------------------------------------------ verification
    /// @notice Re-derives the whole hash chain and checks it matches the stored head.
    function verifyChain(bytes32 id) external view returns (bool) {
        Sample storage s = _sample(id);
        Record[] storage h = history[id];
        bytes32 prev = id;
        for (uint256 i = 0; i < h.length; i++) {
            Record memory r = h[i];
            if (r.prevHash != prev || _hash(r) != r.recordHash) return false;
            prev = r.recordHash;
        }
        return prev == s.headHash;
    }

    /// @notice Was a test result with this report hash recorded for the sample?
    function verifyTestResult(bytes32 id, bytes32 resultHash) external view returns (bool found, uint256 index) {
        _sample(id);
        Record[] storage h = history[id];
        for (uint256 i = 0; i < h.length; i++) {
            if (h[i].recType == RecType.Test && h[i].dataHash == resultHash) return (true, i);
        }
        return (false, 0);
    }

    // ------------------------------------------------------------------ views
    function getOrg(address account) external view returns (Org memory) { return orgs[account]; }

    function getSample(bytes32 id) external view returns (Sample memory) {
        if (samples[id].status == Status.None) revert SampleNotFound();
        return samples[id];
    }

    function getHistory(bytes32 id) external view returns (Record[] memory) { return history[id]; }
    function getHistoryLength(bytes32 id) external view returns (uint256) { return history[id].length; }
    function getChildren(bytes32 id) external view returns (bytes32[] memory) { return children[id]; }
    function getHeld(address org) external view returns (bytes32[] memory) { return held[org]; }
    function getIncoming(address org) external view returns (bytes32[] memory) { return incoming[org]; }

    // --------------------------------------------------------------- internal
    function _activeOrg() internal view returns (Org storage o) {
        o = orgs[msg.sender];
        if (!o.active) revert NotActiveOrg();
    }

    function _sample(bytes32 id) internal view returns (Sample storage s) {
        s = samples[id];
        if (s.status == Status.None) revert SampleNotFound();
    }

    function _requireCustodian(Sample storage s) internal view {
        _activeOrg();
        if (s.custodian != msg.sender) revert NotCustodian();
    }

    function _requireStatus(Sample storage s, Status want) internal view {
        if (s.status != want) revert InvalidState(s.status);
    }

    function _requireLive(Sample storage s) internal view {
        if (s.status != Status.Active && s.status != Status.Quarantined) revert InvalidState(s.status);
    }

    function _isBioHandler(OrgType t) internal pure returns (bool) {
        return t == OrgType.Hospital || t == OrgType.Laboratory || t == OrgType.Research;
    }

    function _quarantine(Sample storage s, bytes32 id, string memory reason) internal {
        statusBeforeQuarantine[id] = s.status;
        s.status = Status.Quarantined;
        _add(id, _rec(RecType.Quarantined, bytes32(0), reason, ""));
    }

    function _rec(RecType t, bytes32 dataHash, string memory note, string memory uri) internal pure returns (Record memory r) {
        r.recType = t;
        r.dataHash = dataHash;
        r.temp = NO_TEMP;
        r.note = note;
        r.uri = uri;
    }

    function _add(bytes32 id, Record memory r) internal {
        Sample storage s = samples[id];
        r.actor = msg.sender;
        r.timestamp = uint64(block.timestamp);
        r.prevHash = s.headHash;
        r.recordHash = _hash(r);
        history[id].push(r);
        s.headHash = r.recordHash;
        emit RecordAdded(id, history[id].length - 1, r.recType, msg.sender, r.recordHash);
    }

    function _hash(Record memory r) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(
            r.prevHash, uint8(r.recType), r.actor, r.timestamp, r.dataHash, r.temp,
            keccak256(bytes(r.note)), keccak256(bytes(r.uri))
        ));
    }
}
