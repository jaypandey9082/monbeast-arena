// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { ERC721 } from "openzeppelin-contracts/contracts/token/ERC721/ERC721.sol";
import { Ownable } from "openzeppelin-contracts/contracts/access/Ownable.sol";
import { ReentrancyGuard } from "openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";

contract MonBeastArena is ERC721, Ownable, ReentrancyGuard {
    uint16 public constant STAT_TOTAL = 100;
    uint16 public constant STAT_MIN = 5;
    uint256 public constant MINT_FEE = 0.02 ether;
    uint256 public constant MAX_PROMPT_LENGTH = 240;

    uint256 public nextBeastId = 1;
    uint256 public nextChallengeId = 1;
    address public treasury;

    struct Beast {
        string prompt;
        string imageURI;
        uint16 atk;
        uint16 def;
        uint16 hp;
        uint16 spd;
        uint16 level;
        uint16 wins;
        uint16 losses;
    }

    struct Challenge {
        uint256 id;
        uint256 beastId;
        address challenger;
        bool open;
    }

    struct OpenChallenge {
        uint256 id;
        uint256 beastId;
        address challenger;
    }

    mapping(uint256 => Beast) private _beasts;
    mapping(uint256 => bool) public locked;
    mapping(uint256 => Challenge) public challenges;

    event BeastMinted(
        uint256 indexed beastId, address indexed owner, string prompt, string imageURI
    );
    event ChallengeCreated(
        uint256 indexed challengeId, uint256 indexed beastId, address indexed challenger
    );
    event ChallengeCancelled(uint256 indexed challengeId, uint256 indexed beastId);
    event BattleResolved(
        uint256 indexed challengeId,
        uint256 indexed winnerId,
        uint256 indexed loserId,
        address winner,
        address loser,
        uint256 winnerPower,
        uint256 loserPower
    );
    event BeastLeveled(uint256 indexed beastId, uint16 newLevel);
    event TreasuryUpdated(address indexed treasury);
    event FeesWithdrawn(address indexed to, uint256 amount);

    error EmptyPrompt();
    error PromptTooLong();
    error EmptyImageURI();
    error WrongMintFee(uint256 sent, uint256 required);
    error InvalidTreasury();
    error BeastDoesNotExist(uint256 beastId);
    error NotBeastOwner(uint256 beastId);
    error BeastLocked(uint256 beastId);
    error ChallengeDoesNotExist(uint256 challengeId);
    error ChallengeNotOpen(uint256 challengeId);
    error NotChallengeCreator(uint256 challengeId);
    error SelfBattle();
    error FeeWithdrawFailed();
    error InvalidWithdrawAddress();

    constructor(address initialOwner, address treasury_)
        ERC721("MonBeast Arena", "MBEAST")
        Ownable(initialOwner)
    {
        if (treasury_ == address(0)) {
            revert InvalidTreasury();
        }

        treasury = treasury_;
        emit TreasuryUpdated(treasury_);
    }

    function setTreasury(address treasury_) external onlyOwner {
        if (treasury_ == address(0)) {
            revert InvalidTreasury();
        }

        treasury = treasury_;
        emit TreasuryUpdated(treasury_);
    }

    function mintBeast(string calldata prompt, string calldata imageURI)
        external
        payable
        nonReentrant
        returns (uint256 beastId)
    {
        if (msg.value != MINT_FEE) {
            revert WrongMintFee(msg.value, MINT_FEE);
        }

        bytes calldata promptBytes = bytes(prompt);
        if (promptBytes.length == 0) {
            revert EmptyPrompt();
        }
        if (promptBytes.length > MAX_PROMPT_LENGTH) {
            revert PromptTooLong();
        }
        if (bytes(imageURI).length == 0) {
            revert EmptyImageURI();
        }

        beastId = nextBeastId++;

        (uint16 atk, uint16 def, uint16 hp, uint16 spd) = _generateStats(
            keccak256(abi.encodePacked(prompt, msg.sender, beastId, block.chainid))
        );

        _beasts[beastId] = Beast({
            prompt: prompt,
            imageURI: imageURI,
            atk: atk,
            def: def,
            hp: hp,
            spd: spd,
            level: 1,
            wins: 0,
            losses: 0
        });

        _safeMint(msg.sender, beastId);

        emit BeastMinted(beastId, msg.sender, prompt, imageURI);
    }

    function createChallenge(uint256 beastId) external nonReentrant returns (uint256 challengeId) {
        _requireBeastOwner(beastId, msg.sender);
        if (locked[beastId]) {
            revert BeastLocked(beastId);
        }

        locked[beastId] = true;
        challengeId = nextChallengeId++;
        challenges[challengeId] =
            Challenge({ id: challengeId, beastId: beastId, challenger: msg.sender, open: true });

        emit ChallengeCreated(challengeId, beastId, msg.sender);
    }

    function cancelChallenge(uint256 challengeId) external nonReentrant {
        Challenge storage challenge = challenges[challengeId];
        if (challenge.id == 0) {
            revert ChallengeDoesNotExist(challengeId);
        }
        if (!challenge.open) {
            revert ChallengeNotOpen(challengeId);
        }
        if (challenge.challenger != msg.sender) {
            revert NotChallengeCreator(challengeId);
        }

        challenge.open = false;
        locked[challenge.beastId] = false;

        emit ChallengeCancelled(challengeId, challenge.beastId);
    }

    function acceptChallenge(uint256 challengeId, uint256 myBeastId) external nonReentrant {
        Challenge storage challenge = challenges[challengeId];
        if (challenge.id == 0) {
            revert ChallengeDoesNotExist(challengeId);
        }
        if (!challenge.open) {
            revert ChallengeNotOpen(challengeId);
        }

        uint256 challengerId = challenge.beastId;
        _requireBeastOwner(myBeastId, msg.sender);
        if (locked[myBeastId]) {
            revert BeastLocked(myBeastId);
        }
        if (challengerId == myBeastId) {
            revert SelfBattle();
        }
        if (!_existsBeast(challengerId)) {
            revert BeastDoesNotExist(challengerId);
        }

        (uint256 winnerId, uint256 loserId, uint256 winnerPower, uint256 loserPower) =
            _resolveBattle(challengerId, myBeastId, challengeId);

        address winner = ownerOf(winnerId);
        address loser = ownerOf(loserId);

        challenge.open = false;
        locked[challengerId] = false;

        Beast storage winnerBeast = _beasts[winnerId];
        Beast storage loserBeast = _beasts[loserId];
        winnerBeast.wins += 1;
        winnerBeast.level += 1;
        loserBeast.losses += 1;

        _transfer(loser, winner, loserId);

        emit BattleResolved(challengeId, winnerId, loserId, winner, loser, winnerPower, loserPower);
        emit BeastLeveled(winnerId, winnerBeast.level);
    }

    function getBeast(uint256 beastId) external view returns (Beast memory) {
        if (!_existsBeast(beastId)) {
            revert BeastDoesNotExist(beastId);
        }

        return _beasts[beastId];
    }

    function getOpenChallenges() external view returns (OpenChallenge[] memory) {
        uint256 openCount;
        uint256 latestChallengeId = nextChallengeId;

        for (uint256 challengeId = 1; challengeId < latestChallengeId; challengeId++) {
            if (challenges[challengeId].open) {
                openCount++;
            }
        }

        OpenChallenge[] memory openChallenges = new OpenChallenge[](openCount);
        uint256 cursor;

        for (uint256 challengeId = 1; challengeId < latestChallengeId; challengeId++) {
            Challenge memory challenge = challenges[challengeId];
            if (challenge.open) {
                openChallenges[cursor] = OpenChallenge({
                    id: challenge.id, beastId: challenge.beastId, challenger: challenge.challenger
                });
                cursor++;
            }
        }

        return openChallenges;
    }

    function getBeastsOfOwner(address owner) external view returns (uint256[] memory) {
        uint256 ownedCount;
        uint256 latestBeastId = nextBeastId;

        for (uint256 beastId = 1; beastId < latestBeastId; beastId++) {
            if (_ownerOf(beastId) == owner) {
                ownedCount++;
            }
        }

        uint256[] memory beastIds = new uint256[](ownedCount);
        uint256 cursor;

        for (uint256 beastId = 1; beastId < latestBeastId; beastId++) {
            if (_ownerOf(beastId) == owner) {
                beastIds[cursor] = beastId;
                cursor++;
            }
        }

        return beastIds;
    }

    function totalBeasts() external view returns (uint256) {
        return nextBeastId - 1;
    }

    function challengeCount() external view returns (uint256) {
        return nextChallengeId - 1;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        if (!_existsBeast(tokenId)) {
            revert BeastDoesNotExist(tokenId);
        }

        return _beasts[tokenId].imageURI;
    }

    function withdrawFees(address payable to) external onlyOwner nonReentrant {
        if (to == address(0)) {
            revert InvalidWithdrawAddress();
        }

        uint256 amount = address(this).balance;
        (bool success,) = to.call{ value: amount }("");
        if (!success) {
            revert FeeWithdrawFailed();
        }

        emit FeesWithdrawn(to, amount);
    }

    function _existsBeast(uint256 beastId) internal view returns (bool) {
        return beastId > 0 && beastId < nextBeastId && _ownerOf(beastId) != address(0);
    }

    function _generateStats(bytes32 seed)
        internal
        pure
        returns (uint16 atk, uint16 def, uint16 hp, uint16 spd)
    {
        uint16 remaining = STAT_TOTAL - (4 * STAT_MIN);

        uint16 atkBonus = uint16(uint256(seed) % (remaining + 1));
        remaining -= atkBonus;

        uint16 defBonus = uint16(uint256(seed >> 64) % (remaining + 1));
        remaining -= defBonus;

        uint16 hpBonus = uint16(uint256(seed >> 128) % (remaining + 1));
        remaining -= hpBonus;

        atk = STAT_MIN + atkBonus;
        def = STAT_MIN + defBonus;
        hp = STAT_MIN + hpBonus;
        spd = STAT_MIN + remaining;

        assert(atk >= STAT_MIN && def >= STAT_MIN && hp >= STAT_MIN && spd >= STAT_MIN);
        assert(atk + def + hp + spd == STAT_TOTAL);
    }

    function _resolveBattle(uint256 challengerId, uint256 defenderId, uint256 challengeId)
        internal
        view
        returns (uint256 winnerId, uint256 loserId, uint256 winnerPower, uint256 loserPower)
    {
        uint256 challengerPower = _power(
            challengerId,
            uint256(
                keccak256(
                    abi.encodePacked(
                        block.prevrandao,
                        block.timestamp,
                        block.number,
                        challengeId,
                        challengerId,
                        defenderId,
                        "A"
                    )
                )
            )
        );
        uint256 defenderPower = _power(
            defenderId,
            uint256(
                keccak256(
                    abi.encodePacked(
                        block.prevrandao,
                        block.timestamp,
                        block.number,
                        challengeId,
                        challengerId,
                        defenderId,
                        "B"
                    )
                )
            )
        );

        if (challengerPower >= defenderPower) {
            return (challengerId, defenderId, challengerPower, defenderPower);
        }

        return (defenderId, challengerId, defenderPower, challengerPower);
    }

    function _power(uint256 beastId, uint256 rand) internal view returns (uint256) {
        Beast storage beast = _beasts[beastId];

        return uint256(beast.atk) * 12 + uint256(beast.spd) * 11 + uint256(beast.def) * 10
            + uint256(beast.hp) * 9 + uint256(beast.level) * 50 + rand % 100;
    }

    function _requireBeastOwner(uint256 beastId, address expectedOwner) internal view {
        if (!_existsBeast(beastId)) {
            revert BeastDoesNotExist(beastId);
        }
        if (ownerOf(beastId) != expectedOwner) {
            revert NotBeastOwner(beastId);
        }
    }

    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        returns (address)
    {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0) && locked[tokenId]) {
            revert BeastLocked(tokenId);
        }

        return super._update(to, tokenId, auth);
    }
}
