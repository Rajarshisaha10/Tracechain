// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SampleChain
 * @notice Enterprise permissioned registry for biological & scientific sample chain of custody.
 *
 * Key Pillars:
 *  - Tamper Evidence : Every handling event is appended to a per-sample hash chain anchored at
 *                      the unique `sampleId`. Each record binds `prevHash`, actor, timestamp,
 *                      payload hashes, and temperature readings. The entire provenance is
 *                      verifiable against the contract's stored `headHash`.
 *  - Two-Step Custody: Transfers require atomic sender dispatch and recipient acceptance.
 *                      Recipients explicitly certify physical integrity on receipt; compromised
 *                      or out-of-spec deliveries are automatically quarantined.
 *  - Role Governance : Access restricted to active, vetted entities (Hospitals, Laboratories,
 *                      Research Centers, Couriers, and Compliance Auditors).
 *  - Privacy First   : Only hashes (consent forms, pseudonymous subject IDs, lab report hashes)
 *                      are stored on-chain. Zero PII is exposed.
 *  - Blind Testing   : Opaque blind identifiers uncouple patient identity from lab-facing records.
 *  - Independent Attestation & Retesting:
 *                      Cryptographically signed lab reports, auditor-initiated secondary retesting
 *                      by independent facilities, and tamper-evident discrepancy investigation workflows.
 *  - Batch Operations: Supports batch transfers for cryogenic transport racks and multi-vial shipments.
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
        AdminReassigned,     // 15 dataHash = new custodian address
        ReportAttested,      // 16 dataHash = reportHash, note = testType & version
        RetestRequested,     // 17 dataHash = requestId, note = reason & designatedLab
        RetestReported,      // 18 dataHash = retestReportHash, note = findings
        DiscrepancyFlagged,  // 19 dataHash = caseId, note = discrepancyReason
        DiscrepancyResolved  // 20 dataHash = caseId, note = disposition
    }

    enum DiscrepancyStatus { Open, UnderReview, Resolved, Escalated }
    enum DiscrepancyDisposition { None, AffirmedOriginal, AffirmedRetest, InconclusiveReCollect, ContaminatedDiscard }

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
        string externalId;       // barcode / label, unique per creating organization
        string sampleType;       // e.g. "Whole Blood", "Tumor Biopsy", "RNA Extract"
        address origin;          // organization that originally collected the specimen
        address creator;         // organization that registered this record (differs for aliquots)
        uint64 collectedAt;
        bytes32 consentHash;     // cryptographic hash of informed consent document
        bytes32 subjectHash;     // hash of pseudonymous subject reference
        bytes32 parentId;        // 0 unless derived aliquot
        address custodian;       // current organization holding custody
        address pendingRecipient;// destination during transit
        Status status;
        bytes32 headHash;        // hash-chain tip over the complete event history
        string blindId;          // Opaque blind testing identifier (non-identifying)
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

    struct AttestedReport {
        bytes32 sampleId;
        address laboratory;
        string testType;
        bytes32 reportHash;
        string findings;         // Qualitative summary (e.g. "NEGATIVE", "PATHOGENIC_MUTATION_DETECTED")
        uint32 reportVersion;
        uint64 timestamp;
        bytes signature;
        string uri;
        bool isRetest;
        bytes32 originalReportHash;
    }

    struct RetestRequest {
        bytes32 requestId;
        bytes32 sampleId;
        address initiator;        // Auditor or Admin
        address originalLab;      // Laboratory that recorded the original test
        address designatedLab;    // Independent secondary laboratory
        bytes32 originalReportHash;
        string reason;
        uint64 requestedAt;
        bool completed;
        bytes32 retestReportHash;
    }

    struct DiscrepancyCase {
        bytes32 caseId;
        bytes32 sampleId;
        bytes32 requestId;
        bytes32 originalReportHash;
        bytes32 retestReportHash;
        address originalLab;
        address retestLab;
        string reason;
        bytes32 evidenceHash;
        DiscrepancyStatus status;
        DiscrepancyDisposition disposition;
        string resolutionReason;
        address reviewer;
        uint64 flaggedAt;
        uint64 resolvedAt;
    }

    // ---------------------------------------------------------------- constants & storage
    int32 public constant NO_TEMP = type(int32).min;

    address public admin;
    address public pendingAdmin;
    bool public paused;

    // Entity tracking
    mapping(address => Org) private orgs;
    address[] private orgList;

    // Sample tracking
    mapping(bytes32 => Sample) private samples;
    bytes32[] private allSampleIds;
    mapping(bytes32 => Record[]) private history;
    mapping(bytes32 => bytes32[]) private children;
    mapping(bytes32 => Status) private statusBeforeQuarantine;

    // Index mappings
    mapping(address => bytes32[]) private held;      // every sample an org has ever held
    mapping(address => bytes32[]) private incoming;  // transfers offered to an org

    // Verification & Discrepancy Storage
    mapping(bytes32 => AttestedReport[]) private attestedReports;     // sampleId => reports
    mapping(bytes32 => RetestRequest) private retestRequests;           // requestId => request
    mapping(bytes32 => bytes32[]) private sampleRetestRequestIds;      // sampleId => requestIds
    bytes32[] private allRetestRequestIds;

    mapping(bytes32 => DiscrepancyCase) private discrepancyCases;      // caseId => case
    mapping(bytes32 => bytes32[]) private sampleDiscrepancyCaseIds;    // sampleId => caseIds
    bytes32[] private allDiscrepancyCaseIds;

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
    error ArrayLengthMismatch();

    // Verification errors
    error InvalidSignature();
    error RetestLabMustDiffer();
    error InvalidRetestLab();
    error RetestRequestNotFound();
    error RetestAlreadyCompleted();
    error DiscrepancyNotFound();
    error SelfResolutionForbidden();
    error UnauthorizedAuditor();
    error NoAttestedReportFound();

    // ----------------------------------------------------------------- events
    event AdminTransferStarted(address indexed currentAdmin, address indexed pendingAdmin);
    event AdminTransferred(address indexed oldAdmin, address indexed newAdmin);
    event Paused(address indexed by);
    event Unpaused(address indexed by);
    event OrgRegistered(address indexed account, OrgType orgType, bytes2 country, string name);
    event OrgStatusChanged(address indexed account, bool active);
    event SampleRegistered(bytes32 indexed sampleId, address indexed creator, string externalId, string sampleType);
    event BlindIdAssociated(bytes32 indexed sampleId, string blindId);
    event AliquotCreated(bytes32 indexed parentId, bytes32 indexed childId, address indexed creator, string externalId);
    event TransferInitiated(bytes32 indexed sampleId, address indexed from, address indexed to);
    event TransferCompleted(bytes32 indexed sampleId, address indexed recipient, bool intact);
    event TransferRejected(bytes32 indexed sampleId, address indexed recipient, string reason);
    event TransferCancelled(bytes32 indexed sampleId, address indexed sender, string reason);
    event RecordAdded(bytes32 indexed sampleId, uint256 index, RecType indexed recType, address indexed actor, bytes32 recordHash);
    event TemperatureLogged(bytes32 indexed sampleId, int32 tempCx10, string location);
    event IncidentLogged(bytes32 indexed sampleId, address indexed reporter, string description);
    event SampleQuarantined(bytes32 indexed sampleId, address indexed by, string reason);
    event SampleReleased(bytes32 indexed sampleId, address indexed by, string note);
    event SampleFinalized(bytes32 indexed sampleId, Status finalStatus, string reason);

    // Verification events
    event ReportAttested(bytes32 indexed sampleId, address indexed laboratory, bytes32 indexed reportHash, uint32 version, string findings);
    event RetestRequested(bytes32 indexed requestId, bytes32 indexed sampleId, address indexed initiator, address designatedLab);
    event RetestReported(bytes32 indexed requestId, bytes32 indexed sampleId, address indexed retestLab, bytes32 reportHash, string findings);
    event DiscrepancyFlagged(bytes32 indexed caseId, bytes32 indexed sampleId, address indexed reporter, string reason);
    event DiscrepancyStatusUpdated(bytes32 indexed caseId, DiscrepancyStatus status, string note);
    event DiscrepancyResolved(bytes32 indexed caseId, bytes32 indexed sampleId, address indexed reviewer, DiscrepancyDisposition disposition, string reason);

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

    // ------------------------------------------------------------------ admin functions
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

    function pause() external onlyAdmin {
        paused = true;
        emit Paused(msg.sender);
    }

    function unpause() external onlyAdmin {
        paused = false;
        emit Unpaused(msg.sender);
    }

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

        orgs[account] = Org({
            name: name,
            orgType: orgType,
            country: country,
            active: true,
            accreditationHash: accreditationHash,
            registeredAt: uint64(block.timestamp)
        });
        orgList.push(account);
        emit OrgRegistered(account, orgType, country, name);
    }

    function setOrgActive(address account, bool active) external onlyAdmin whenNotPaused {
        if (orgs[account].orgType == OrgType.None) revert InvalidInput();
        orgs[account].active = active;
        emit OrgStatusChanged(account, active);
    }

    /// @notice Recover custody when the custodian is suspended or defunct. Recorded permanently.
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

    // ---------------------------------------------------------------- sample lifecycle
    function computeSampleId(address creator, string memory externalId) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(creator, externalId));
    }

    function registerSample(NewSample calldata p) external whenNotPaused returns (bytes32 id) {
        return _registerInternal(p, "");
    }

    /// @notice Register sample with an opaque Blind Testing ID for privacy preservation
    function registerSampleBlind(NewSample calldata p, string calldata blindId) external whenNotPaused returns (bytes32 id) {
        return _registerInternal(p, blindId);
    }

    function _registerInternal(NewSample calldata p, string memory blindId) internal returns (bytes32 id) {
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
        s.blindId = blindId;
        
        allSampleIds.push(id);
        held[msg.sender].push(id);

        _add(id, _rec(RecType.Collected, p.consentHash, p.note, ""));
        emit SampleRegistered(id, msg.sender, p.externalId, p.sampleType);
        if (bytes(blindId).length > 0) {
            emit BlindIdAssociated(id, blindId);
        }
    }

    /// @notice Associate or update an opaque Blind Testing ID on an active sample
    function setBlindId(bytes32 id, string calldata blindId) external whenNotPaused {
        Sample storage s = _sample(id);
        Org storage o = _activeOrg();
        if (msg.sender != s.creator && msg.sender != s.custodian && o.orgType != OrgType.Auditor && msg.sender != admin) {
            revert Unauthorized();
        }
        if (bytes(blindId).length == 0) revert InvalidInput();
        s.blindId = blindId;
        emit BlindIdAssociated(id, blindId);
    }

    /// @notice Split off a child sample (aliquot) from a held sample
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
        cs.blindId = bytes(ps.blindId).length > 0 ? string.concat(ps.blindId, "-ALQ") : "";

        allSampleIds.push(childId);
        children[parentId].push(childId);
        held[msg.sender].push(childId);

        _add(parentId, _rec(RecType.AliquotCreated, childId, note, ""));
        _add(childId, _rec(RecType.DerivedFrom, parentId, note, ""));
        emit AliquotCreated(parentId, childId, msg.sender, externalId);
    }

    // ---------------------------------------------------------------- custody & logistics
    function initiateTransfer(bytes32 id, address to, string calldata note) public whenNotPaused {
        Sample storage s = _sample(id);
        _requireCustodian(s);
        _requireStatus(s, Status.Active);
        Org storage r = orgs[to];
        if (!r.active || to == msg.sender || r.orgType == OrgType.Auditor) revert InvalidRecipient();

        s.pendingRecipient = to;
        s.status = Status.InTransit;
        incoming[to].push(id);
        _add(id, _rec(RecType.TransferInitiated, bytes32(uint256(uint160(to))), note, ""));
        emit TransferInitiated(id, msg.sender, to);
    }

    /// @notice Batch initiate transfers (e.g. rack of vials in cryogenic transit)
    function batchInitiateTransfer(bytes32[] calldata ids, address to, string calldata note) external whenNotPaused {
        for (uint256 i = 0; i < ids.length; i++) {
            initiateTransfer(ids[i], to, note);
        }
    }

    /// @param intact false = specimen arrived damaged or compromised; quarantined automatically
    function acceptTransfer(bytes32 id, bool intact, string calldata note) public whenNotPaused {
        Sample storage s = _sample(id);
        if (s.status != Status.InTransit) revert InvalidState(s.status);
        if (s.pendingRecipient != msg.sender) revert NotRecipient();
        _activeOrg();

        s.custodian = msg.sender;
        s.pendingRecipient = address(0);
        s.status = Status.Active;
        held[msg.sender].push(id);
        _add(id, _rec(RecType.TransferAccepted, intact ? bytes32(uint256(1)) : bytes32(0), note, ""));
        emit TransferCompleted(id, msg.sender, intact);

        if (!intact) {
            _quarantine(s, id, "Received in damaged/compromised condition");
        }
    }

    /// @notice Batch accept transfers
    function batchAcceptTransfer(bytes32[] calldata ids, bool[] calldata intact, string calldata note) external whenNotPaused {
        if (ids.length != intact.length) revert ArrayLengthMismatch();
        for (uint256 i = 0; i < ids.length; i++) {
            acceptTransfer(ids[i], intact[i], note);
        }
    }

    function rejectTransfer(bytes32 id, string calldata reason) external whenNotPaused {
        Sample storage s = _sample(id);
        if (s.status != Status.InTransit) revert InvalidState(s.status);
        if (s.pendingRecipient != msg.sender) revert NotRecipient();
        _activeOrg();

        s.pendingRecipient = address(0);
        s.status = Status.Active; // custody remains with original sender
        _add(id, _rec(RecType.TransferRejected, bytes32(0), reason, ""));
        emit TransferRejected(id, msg.sender, reason);
    }

    function cancelTransfer(bytes32 id, string calldata reason) external whenNotPaused {
        Sample storage s = _sample(id);
        _requireCustodian(s);
        _requireStatus(s, Status.InTransit);
        s.pendingRecipient = address(0);
        s.status = Status.Active;
        _add(id, _rec(RecType.TransferCancelled, bytes32(0), reason, ""));
        emit TransferCancelled(id, msg.sender, reason);
    }

    // --------------------------------------------------------------- handling & telemetry
    /// @param tempCx10 temperature in tenths of a degree Celsius (e.g. -800 = -80.0 C), or NO_TEMP
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

        if (tempCx10 != NO_TEMP) {
            emit TemperatureLogged(id, tempCx10, location);
        }
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

    /// @notice Record diagnostic or genomic test without cryptographic signature (backward compatibility)
    function recordTest(bytes32 id, string calldata testName, bytes32 resultHash, string calldata uri) external whenNotPaused {
        Sample storage s = _sample(id);
        _requireCustodian(s);
        _requireStatus(s, Status.Active);
        OrgType t = orgs[msg.sender].orgType;
        if (t != OrgType.Laboratory && t != OrgType.Research) revert Unauthorized();
        if (bytes(testName).length == 0 || resultHash == bytes32(0)) revert InvalidInput();
        _add(id, _rec(RecType.Test, resultHash, testName, uri));
    }

    // ------------------------------------------------------------------ FEATURE TWO: ATTESTED REPORTS
    /// @notice Computes canonical payload hash for lab report attestation
    function computeReportPayloadHash(
        bytes32 sampleId,
        address laboratory,
        string memory testType,
        bytes32 reportHash,
        string memory findings,
        uint32 reportVersion,
        uint64 timestamp
    ) public pure returns (bytes32) {
        return keccak256(abi.encode(
            sampleId,
            laboratory,
            keccak256(bytes(testType)),
            reportHash,
            keccak256(bytes(findings)),
            reportVersion,
            timestamp
        ));
    }

    /// @notice Records a cryptographically attested laboratory report signed by an authorized laboratory wallet.
    function recordAttestedTest(
        bytes32 id,
        string calldata testType,
        bytes32 reportHash,
        string calldata findings,
        string calldata uri,
        bytes calldata signature
    ) external whenNotPaused returns (uint32 version) {
        Sample storage s = _sample(id);
        _requireCustodian(s);
        _requireStatus(s, Status.Active);
        OrgType t = orgs[msg.sender].orgType;
        if (t != OrgType.Laboratory && t != OrgType.Research) revert Unauthorized();
        if (bytes(testType).length == 0 || reportHash == bytes32(0) || bytes(findings).length == 0) revert InvalidInput();

        uint32 currentVer = uint32(attestedReports[id].length) + 1;
        uint64 nowTs = uint64(block.timestamp);

        // Verify ECDSA signature of payload
        bytes32 payloadHash = computeReportPayloadHash(id, msg.sender, testType, reportHash, findings, currentVer, nowTs);
        bytes32 ethSignedHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", payloadHash));
        address recovered = recoverSigner(ethSignedHash, signature);
        if (recovered != msg.sender) revert InvalidSignature();

        AttestedReport memory r = AttestedReport({
            sampleId: id,
            laboratory: msg.sender,
            testType: testType,
            reportHash: reportHash,
            findings: findings,
            reportVersion: currentVer,
            timestamp: nowTs,
            signature: signature,
            uri: uri,
            isRetest: false,
            originalReportHash: bytes32(0)
        });
        attestedReports[id].push(r);

        string memory noteStr = currentVer == 1
            ? string.concat("Attested Report v1: ", testType, " [", findings, "]")
            : string.concat("Superceded Attested Report v", _uintToString(currentVer), ": ", testType, " [", findings, "]");

        _add(id, _rec(RecType.ReportAttested, reportHash, noteStr, uri));
        emit ReportAttested(id, msg.sender, reportHash, currentVer, findings);
        return currentVer;
    }

    // ------------------------------------------------------------------ FEATURE THREE: INDEPENDENT RETESTING
    /// @notice Request secondary independent verification test by an authorized independent lab
    function requestIndependentRetest(
        bytes32 sampleId,
        address designatedLab,
        string calldata reason
    ) external whenNotPaused returns (bytes32 requestId) {
        Org storage o = _activeOrg();
        if (msg.sender != admin && o.orgType != OrgType.Auditor) revert UnauthorizedAuditor();
        _sample(sampleId);

        uint256 repCount = attestedReports[sampleId].length;
        if (repCount == 0) revert NoAttestedReportFound();
        AttestedReport storage latestRep = attestedReports[sampleId][repCount - 1];

        if (designatedLab == latestRep.laboratory) revert RetestLabMustDiffer();
        Org storage desOrg = orgs[designatedLab];
        if (!desOrg.active || (desOrg.orgType != OrgType.Laboratory && desOrg.orgType != OrgType.Research)) {
            revert InvalidRetestLab();
        }
        if (bytes(reason).length == 0) revert InvalidInput();

        requestId = keccak256(abi.encodePacked(sampleId, designatedLab, block.timestamp, allRetestRequestIds.length));
        retestRequests[requestId] = RetestRequest({
            requestId: requestId,
            sampleId: sampleId,
            initiator: msg.sender,
            originalLab: latestRep.laboratory,
            designatedLab: designatedLab,
            originalReportHash: latestRep.reportHash,
            reason: reason,
            requestedAt: uint64(block.timestamp),
            completed: false,
            retestReportHash: bytes32(0)
        });

        allRetestRequestIds.push(requestId);
        sampleRetestRequestIds[sampleId].push(requestId);

        _add(sampleId, _rec(
            RecType.RetestRequested,
            requestId,
            string.concat("Independent retest requested. Assigned: ", desOrg.name, " | ", reason),
            ""
        ));

        emit RetestRequested(requestId, sampleId, msg.sender, designatedLab);
    }

    /// @notice Secondary laboratory records its independently verified report
    function recordRetestReport(
        bytes32 requestId,
        bytes32 reportHash,
        string calldata findings,
        string calldata uri,
        bytes calldata signature
    ) external whenNotPaused {
        RetestRequest storage req = retestRequests[requestId];
        if (req.requestId == bytes32(0)) revert RetestRequestNotFound();
        if (req.completed) revert RetestAlreadyCompleted();
        if (msg.sender != req.designatedLab) revert Unauthorized();
        if (msg.sender == req.originalLab) revert RetestLabMustDiffer();
        if (reportHash == bytes32(0) || bytes(findings).length == 0) revert InvalidInput();

        Sample storage s = _sample(req.sampleId);
        _requireCustodian(s);
        _requireLive(s);

        uint64 nowTs = uint64(block.timestamp);
        bytes32 payloadHash = computeReportPayloadHash(
            req.sampleId,
            msg.sender,
            "Independent Retest Verification",
            reportHash,
            findings,
            1,
            nowTs
        );
        bytes32 ethSignedHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", payloadHash));
        address recovered = recoverSigner(ethSignedHash, signature);
        if (recovered != msg.sender) revert InvalidSignature();

        req.completed = true;
        req.retestReportHash = reportHash;

        AttestedReport memory rep = AttestedReport({
            sampleId: req.sampleId,
            laboratory: msg.sender,
            testType: "Independent Retest Verification",
            reportHash: reportHash,
            findings: findings,
            reportVersion: 1,
            timestamp: nowTs,
            signature: signature,
            uri: uri,
            isRetest: true,
            originalReportHash: req.originalReportHash
        });
        attestedReports[req.sampleId].push(rep);

        _add(req.sampleId, _rec(
            RecType.RetestReported,
            reportHash,
            string.concat("Independent Retest Submitted [", findings, "]"),
            uri
        ));

        emit RetestReported(requestId, req.sampleId, msg.sender, reportHash, findings);
    }

    // ------------------------------------------------------------------ FEATURE FOUR: DISCREPANCIES
    /// @notice Flags a material discrepancy between original and secondary retest results
    function flagDiscrepancy(
        bytes32 requestId,
        string calldata reason,
        bytes32 evidenceHash,
        bool placeOnQuarantine
    ) external whenNotPaused returns (bytes32 caseId) {
        RetestRequest storage req = retestRequests[requestId];
        if (req.requestId == bytes32(0)) revert RetestRequestNotFound();
        if (!req.completed) revert InvalidInput();
        if (bytes(reason).length == 0) revert InvalidInput();

        // The original laboratory CANNOT flag or dismiss cases to cover its own tracks
        if (msg.sender == req.originalLab) revert Unauthorized();

        Org storage o = _activeOrg();
        if (msg.sender != admin && o.orgType != OrgType.Auditor && msg.sender != req.designatedLab) {
            revert Unauthorized();
        }

        caseId = keccak256(abi.encodePacked(requestId, block.timestamp, allDiscrepancyCaseIds.length));
        discrepancyCases[caseId] = DiscrepancyCase({
            caseId: caseId,
            sampleId: req.sampleId,
            requestId: requestId,
            originalReportHash: req.originalReportHash,
            retestReportHash: req.retestReportHash,
            originalLab: req.originalLab,
            retestLab: req.designatedLab,
            reason: reason,
            evidenceHash: evidenceHash,
            status: DiscrepancyStatus.Open,
            disposition: DiscrepancyDisposition.None,
            resolutionReason: "",
            reviewer: address(0),
            flaggedAt: uint64(block.timestamp),
            resolvedAt: 0
        });

        allDiscrepancyCaseIds.push(caseId);
        sampleDiscrepancyCaseIds[req.sampleId].push(caseId);

        Sample storage s = _sample(req.sampleId);
        if (placeOnQuarantine && s.status != Status.Quarantined) {
            _quarantine(s, req.sampleId, string.concat("Quarantined: Investigation of Discrepancy #", reason));
        }

        _add(req.sampleId, _rec(
            RecType.DiscrepancyFlagged,
            caseId,
            string.concat("Discrepancy Investigation Opened: ", reason),
            ""
        ));

        emit DiscrepancyFlagged(caseId, req.sampleId, msg.sender, reason);
    }

    /// @notice Updates status of an active discrepancy investigation
    function updateDiscrepancyStatus(
        bytes32 caseId,
        DiscrepancyStatus newStatus,
        string calldata note
    ) external whenNotPaused {
        DiscrepancyCase storage c = discrepancyCases[caseId];
        if (c.caseId == bytes32(0)) revert DiscrepancyNotFound();
        Org storage o = _activeOrg();
        if (msg.sender != admin && o.orgType != OrgType.Auditor) revert UnauthorizedAuditor();
        if (msg.sender == c.originalLab) revert SelfResolutionForbidden();

        c.status = newStatus;
        emit DiscrepancyStatusUpdated(caseId, newStatus, note);
    }

    /// @notice Resolves a discrepancy case with binding disposition and rationale
    function resolveDiscrepancy(
        bytes32 caseId,
        DiscrepancyDisposition disposition,
        string calldata resolutionReason,
        bytes32 evidenceHash,
        bool releaseFromQuarantine
    ) external whenNotPaused {
        DiscrepancyCase storage c = discrepancyCases[caseId];
        if (c.caseId == bytes32(0)) revert DiscrepancyNotFound();
        if (c.status == DiscrepancyStatus.Resolved) revert InvalidInput();
        if (disposition == DiscrepancyDisposition.None || bytes(resolutionReason).length == 0) revert InvalidInput();

        // Strict Anti-Tamper Rule: Original laboratory cannot unilaterally resolve or close disputes against itself
        if (msg.sender == c.originalLab) revert SelfResolutionForbidden();

        Org storage o = _activeOrg();
        if (msg.sender != admin && o.orgType != OrgType.Auditor) revert UnauthorizedAuditor();

        c.status = DiscrepancyStatus.Resolved;
        c.disposition = disposition;
        c.resolutionReason = resolutionReason;
        c.evidenceHash = evidenceHash != bytes32(0) ? evidenceHash : c.evidenceHash;
        c.reviewer = msg.sender;
        c.resolvedAt = uint64(block.timestamp);

        Sample storage s = _sample(c.sampleId);
        if (releaseFromQuarantine && s.status == Status.Quarantined) {
            s.status = statusBeforeQuarantine[c.sampleId];
            _add(c.sampleId, _rec(RecType.Released, bytes32(0), string.concat("Released after discrepancy resolution: ", resolutionReason), ""));
            emit SampleReleased(c.sampleId, msg.sender, resolutionReason);
        }

        _add(c.sampleId, _rec(
            RecType.DiscrepancyResolved,
            caseId,
            string.concat("Discrepancy Case Resolved: ", resolutionReason),
            ""
        ));

        emit DiscrepancyResolved(caseId, c.sampleId, msg.sender, disposition, resolutionReason);
    }

    // ------------------------------------------------------------------ general incident & quarantine
    function logIncident(bytes32 id, string calldata description, bytes32 evidenceHash, string calldata uri) external whenNotPaused {
        Sample storage s = _sample(id);
        if (s.status == Status.Consumed || s.status == Status.Destroyed) revert InvalidState(s.status);
        Org storage o = _activeOrg();
        if (msg.sender != s.custodian && msg.sender != s.pendingRecipient && o.orgType != OrgType.Auditor) {
            revert Unauthorized();
        }
        if (bytes(description).length == 0) revert InvalidInput();
        _add(id, _rec(RecType.Incident, evidenceHash, description, uri));
        emit IncidentLogged(id, msg.sender, description);
    }

    function quarantine(bytes32 id, string calldata reason) external whenNotPaused {
        Sample storage s = _sample(id);
        if (s.status != Status.Active && s.status != Status.InTransit) revert InvalidState(s.status);
        if (msg.sender != admin) {
            Org storage o = _activeOrg();
            if (o.orgType != OrgType.Auditor && msg.sender != s.custodian) revert Unauthorized();
        }
        _quarantine(s, id, reason);
    }

    /// @notice Only an auditor or network admin can release a quarantine hold
    function release(bytes32 id, string calldata note) external whenNotPaused {
        Sample storage s = _sample(id);
        if (s.status != Status.Quarantined) revert InvalidState(s.status);
        if (msg.sender != admin) {
            if (orgs[msg.sender].orgType != OrgType.Auditor || !orgs[msg.sender].active) revert Unauthorized();
        }
        s.status = statusBeforeQuarantine[id];
        _add(id, _rec(RecType.Released, bytes32(0), note, ""));
        emit SampleReleased(id, msg.sender, note);
    }

    // -------------------------------------------------------------- lifecycle terminal
    function markConsumed(bytes32 id, string calldata reason) external whenNotPaused {
        Sample storage s = _sample(id);
        _requireCustodian(s);
        _requireStatus(s, Status.Active);
        OrgType t = orgs[msg.sender].orgType;
        if (t != OrgType.Laboratory && t != OrgType.Research) revert Unauthorized();
        s.status = Status.Consumed;
        _add(id, _rec(RecType.Consumed, bytes32(0), reason, ""));
        emit SampleFinalized(id, Status.Consumed, reason);
    }

    function markDestroyed(bytes32 id, string calldata reason) external whenNotPaused {
        Sample storage s = _sample(id);
        _requireCustodian(s);
        if (s.status != Status.Active && s.status != Status.Quarantined) revert InvalidState(s.status);
        if (!_isBioHandler(orgs[msg.sender].orgType)) revert Unauthorized();
        s.status = Status.Destroyed;
        _add(id, _rec(RecType.Destroyed, bytes32(0), reason, ""));
        emit SampleFinalized(id, Status.Destroyed, reason);
    }

    // ------------------------------------------------------------ verification
    /// @notice Re-computes the entire cryptographic hash chain and validates it against stored headHash
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

    /// @notice Verify whether a test report hash was committed to chain
    function verifyTestResult(bytes32 id, bytes32 resultHash) external view returns (bool found, uint256 index) {
        _sample(id);
        Record[] storage h = history[id];
        for (uint256 i = 0; i < h.length; i++) {
            if ((h[i].recType == RecType.Test || h[i].recType == RecType.ReportAttested || h[i].recType == RecType.RetestReported) && h[i].dataHash == resultHash) {
                return (true, i);
            }
        }
        return (false, 0);
    }

    // ------------------------------------------------------------------ views & paginated queries
    function getOrg(address account) external view returns (Org memory) {
        return orgs[account];
    }

    function getOrgCount() external view returns (uint256) {
        return orgList.length;
    }

    function getOrgList() external view returns (address[] memory) {
        return orgList;
    }

    function getSample(bytes32 id) external view returns (Sample memory) {
        if (samples[id].status == Status.None) revert SampleNotFound();
        return samples[id];
    }

    function getSampleCount() external view returns (uint256) {
        return allSampleIds.length;
    }

    function getAllSampleIds() external view returns (bytes32[] memory) {
        return allSampleIds;
    }

    function getSampleIdsPaged(uint256 offset, uint256 limit) external view returns (bytes32[] memory ids) {
        uint256 total = allSampleIds.length;
        if (offset >= total) return new bytes32[](0);
        uint256 end = offset + limit;
        if (end > total) end = total;
        uint256 count = end - offset;
        ids = new bytes32[](count);
        for (uint256 i = 0; i < count; i++) {
            ids[i] = allSampleIds[offset + i];
        }
    }

    function getHistory(bytes32 id) external view returns (Record[] memory) {
        return history[id];
    }

    function getHistoryLength(bytes32 id) external view returns (uint256) {
        return history[id].length;
    }

    function getHistoryPaged(bytes32 id, uint256 offset, uint256 limit) external view returns (Record[] memory recs) {
        Record[] storage h = history[id];
        uint256 total = h.length;
        if (offset >= total) return new Record[](0);
        uint256 end = offset + limit;
        if (end > total) end = total;
        uint256 count = end - offset;
        recs = new Record[](count);
        for (uint256 i = 0; i < count; i++) {
            recs[i] = h[offset + i];
        }
    }

    function getChildren(bytes32 id) external view returns (bytes32[] memory) {
        return children[id];
    }

    function getHeld(address orgAccount) external view returns (bytes32[] memory) {
        return held[orgAccount];
    }

    function getIncoming(address orgAccount) external view returns (bytes32[] memory) {
        return incoming[orgAccount];
    }

    // ------------------------------------------------------------------ Verification Queries
    function getAttestedReports(bytes32 sampleId) external view returns (AttestedReport[] memory) {
        return attestedReports[sampleId];
    }

    function getAttestedReportCount(bytes32 sampleId) external view returns (uint256) {
        return attestedReports[sampleId].length;
    }

    function getRetestRequest(bytes32 requestId) external view returns (RetestRequest memory) {
        return retestRequests[requestId];
    }

    function getAllRetestRequestIds() external view returns (bytes32[] memory) {
        return allRetestRequestIds;
    }

    function getSampleRetestRequests(bytes32 sampleId) external view returns (bytes32[] memory) {
        return sampleRetestRequestIds[sampleId];
    }

    function getDiscrepancyCase(bytes32 caseId) external view returns (DiscrepancyCase memory) {
        return discrepancyCases[caseId];
    }

    function getAllDiscrepancyCaseIds() external view returns (bytes32[] memory) {
        return allDiscrepancyCaseIds;
    }

    function getSampleDiscrepancyCases(bytes32 sampleId) external view returns (bytes32[] memory) {
        return sampleDiscrepancyCaseIds[sampleId];
    }

    struct SystemStats {
        uint256 totalSamples;
        uint256 totalOrgs;
        uint256 activeSamples;
        uint256 inTransitSamples;
        uint256 quarantinedSamples;
        uint256 finalSamples;
        uint256 totalRetestRequests;
        uint256 openDiscrepancies;
        uint256 resolvedDiscrepancies;
    }

    function getSystemStats() external view returns (SystemStats memory stats) {
        stats.totalSamples = allSampleIds.length;
        stats.totalOrgs = orgList.length;
        for (uint256 i = 0; i < allSampleIds.length; i++) {
            Status s = samples[allSampleIds[i]].status;
            if (s == Status.Active) stats.activeSamples++;
            else if (s == Status.InTransit) stats.inTransitSamples++;
            else if (s == Status.Quarantined) stats.quarantinedSamples++;
            else if (s == Status.Consumed || s == Status.Destroyed) stats.finalSamples++;
        }
        stats.totalRetestRequests = allRetestRequestIds.length;
        for (uint256 j = 0; j < allDiscrepancyCaseIds.length; j++) {
            DiscrepancyStatus st = discrepancyCases[allDiscrepancyCaseIds[j]].status;
            if (st == DiscrepancyStatus.Open || st == DiscrepancyStatus.UnderReview || st == DiscrepancyStatus.Escalated) {
                stats.openDiscrepancies++;
            } else if (st == DiscrepancyStatus.Resolved) {
                stats.resolvedDiscrepancies++;
            }
        }
    }

    // --------------------------------------------------------------- internal helpers & ECDSA
    function recoverSigner(bytes32 ethSignedMessageHash, bytes memory sig) public pure returns (address) {
        if (sig.length != 65) return address(0);
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
        if (v < 27) v += 27;
        if (v != 27 && v != 28) return address(0);
        return ecrecover(ethSignedMessageHash, v, r, s);
    }

    function _uintToString(uint256 v) internal pure returns (string memory) {
        if (v == 0) return "0";
        uint256 digits;
        uint256 temp = v;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (v != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(v % 10)));
            v /= 10;
        }
        return string(buffer);
    }

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
        emit SampleQuarantined(id, msg.sender, reason);
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
