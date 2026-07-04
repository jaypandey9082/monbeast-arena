// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Test } from "forge-std/Test.sol";
import { MonBeastArena } from "../contracts/src/MonBeastArena.sol";

contract MonBeastArenaTest is Test {
    MonBeastArena internal arena;

    address internal owner = address(0xA11CE);
    address internal treasury = address(0x7E45);
    address internal alice = address(0xA71CE);
    address internal bob = address(0xB0B);
    address internal charlie = address(0xC0DE);

    string internal constant DEFAULT_IMAGE_URI = "ipfs://monbeast";

    event BeastMinted(
        uint256 indexed beastId, address indexed owner, string prompt, string imageURI
    );
    event ChallengeCreated(
        uint256 indexed challengeId, uint256 indexed beastId, address indexed challenger
    );
    event BattleResolved(
        uint256 indexed challengeId,
        uint256 indexed winnerId,
        uint256 indexed loserId,
        address winner,
        address loser,
        uint256 winnerPower,
        uint256 loserPower
    );
    event TreasuryUpdated(address indexed treasury);

    error OwnableUnauthorizedAccount(address account);

    function setUp() public {
        vm.deal(owner, 100 ether);
        vm.deal(alice, 100 ether);
        vm.deal(bob, 100 ether);
        vm.deal(charlie, 100 ether);

        vm.prank(owner);
        arena = new MonBeastArena(owner, treasury);
    }

    function test_InitialState() public view {
        assertEq(arena.nextBeastId(), 1);
        assertEq(arena.totalBeasts(), 0);
        assertEq(arena.nextChallengeId(), 1);
        assertEq(arena.challengeCount(), 0);
        assertEq(arena.treasury(), treasury);
        assertEq(arena.MINT_FEE(), 0.02 ether);
        assertEq(arena.name(), "MonBeast Arena");
        assertEq(arena.symbol(), "MBEAST");
    }

    function test_MintBeast() public {
        string memory prompt = "violet thunder guardian";
        uint256 beastId = _mintAliceBeast(prompt);

        assertEq(arena.ownerOf(beastId), alice);
        MonBeastArena.Beast memory beast = arena.getBeast(beastId);
        assertEq(beast.prompt, prompt);
        assertEq(beast.imageURI, DEFAULT_IMAGE_URI);
        assertEq(beast.level, 1);
        assertEq(beast.wins, 0);
        assertEq(beast.losses, 0);
        _assertStatsValid(beastId);
        assertEq(arena.totalBeasts(), 1);
    }

    function test_MintBeast_EmitsEvent() public {
        string memory prompt = "event beast";

        vm.expectEmit(true, true, false, true, address(arena));
        emit BeastMinted(1, alice, prompt, DEFAULT_IMAGE_URI);

        _mintAliceBeast(prompt);
    }

    function test_Revert_MintWrongFee() public {
        uint256 fee = arena.MINT_FEE();

        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(MonBeastArena.WrongMintFee.selector, 0, fee));
        arena.mintBeast{ value: 0 }("zero fee", DEFAULT_IMAGE_URI);

        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(MonBeastArena.WrongMintFee.selector, fee - 1, fee));
        arena.mintBeast{ value: fee - 1 }("low fee", DEFAULT_IMAGE_URI);

        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(MonBeastArena.WrongMintFee.selector, fee + 1, fee));
        arena.mintBeast{ value: fee + 1 }("high fee", DEFAULT_IMAGE_URI);
    }

    function test_Revert_MintEmptyPrompt() public {
        uint256 fee = arena.MINT_FEE();

        vm.prank(alice);
        vm.expectRevert(MonBeastArena.EmptyPrompt.selector);
        arena.mintBeast{ value: fee }("", DEFAULT_IMAGE_URI);
    }

    function test_Revert_MintPromptTooLong() public {
        string memory longPrompt = _stringOfLength(arena.MAX_PROMPT_LENGTH() + 1);
        uint256 fee = arena.MINT_FEE();

        vm.prank(alice);
        vm.expectRevert(MonBeastArena.PromptTooLong.selector);
        arena.mintBeast{ value: fee }(longPrompt, DEFAULT_IMAGE_URI);
    }

    function test_Revert_MintEmptyImageURI() public {
        uint256 fee = arena.MINT_FEE();

        vm.prank(alice);
        vm.expectRevert(MonBeastArena.EmptyImageURI.selector);
        arena.mintBeast{ value: fee }("empty image", "");
    }

    function test_StatsAreDeterministicEnough() public {
        uint256 beastA = _mintAliceBeast("ember crown");
        uint256 beastB = _mintBobBeast("tidal horn");

        _assertStatsValid(beastA);
        _assertStatsValid(beastB);
        assertEq(_getStatsSum(beastA), arena.STAT_TOTAL());
        assertEq(_getStatsSum(beastB), arena.STAT_TOTAL());
    }

    function test_CreateChallenge() public {
        uint256 beastId = _mintAliceBeast("arena starter");
        uint256 challengeId = _createAliceChallenge(beastId);

        assertEq(arena.challengeCount(), 1);
        MonBeastArena.OpenChallenge[] memory openChallenges = arena.getOpenChallenges();
        assertEq(openChallenges.length, 1);
        assertEq(openChallenges[0].id, challengeId);
        assertEq(openChallenges[0].beastId, beastId);
        assertEq(openChallenges[0].challenger, alice);
        assertTrue(arena.locked(beastId));
    }

    function test_CreateChallenge_EmitsEvent() public {
        uint256 beastId = _mintAliceBeast("event challenge");

        vm.expectEmit(true, true, true, true, address(arena));
        emit ChallengeCreated(1, beastId, alice);

        _createAliceChallenge(beastId);
    }

    function test_Revert_CreateChallenge_NotOwner() public {
        uint256 beastId = _mintAliceBeast("owned by alice");

        vm.prank(bob);
        vm.expectRevert(abi.encodeWithSelector(MonBeastArena.NotBeastOwner.selector, beastId));
        arena.createChallenge(beastId);
    }

    function test_Revert_CreateChallenge_BeastLocked() public {
        uint256 beastId = _mintAliceBeast("locked challenge");
        _createAliceChallenge(beastId);

        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(MonBeastArena.BeastLocked.selector, beastId));
        arena.createChallenge(beastId);
    }

    function test_CancelChallenge() public {
        uint256 beastId = _mintAliceBeast("cancelable");
        uint256 challengeId = _createAliceChallenge(beastId);

        vm.prank(alice);
        arena.cancelChallenge(challengeId);

        assertFalse(_challengeOpen(challengeId));
        assertFalse(arena.locked(beastId));
        assertEq(arena.getOpenChallenges().length, 0);
    }

    function test_Revert_CancelChallenge_NotChallenger() public {
        uint256 beastId = _mintAliceBeast("not challenger");
        uint256 challengeId = _createAliceChallenge(beastId);

        vm.prank(bob);
        vm.expectRevert(
            abi.encodeWithSelector(MonBeastArena.NotChallengeCreator.selector, challengeId)
        );
        arena.cancelChallenge(challengeId);
    }

    function test_Revert_CancelChallenge_NotOpen() public {
        uint256 beastId = _mintAliceBeast("already cancelled");
        uint256 challengeId = _createAliceChallenge(beastId);

        vm.prank(alice);
        arena.cancelChallenge(challengeId);

        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(MonBeastArena.ChallengeNotOpen.selector, challengeId)
        );
        arena.cancelChallenge(challengeId);
    }

    function test_LockedBeastCannotTransfer() public {
        uint256 beastId = _mintAliceBeast("locked transfer");
        _createAliceChallenge(beastId);

        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(MonBeastArena.BeastLocked.selector, beastId));
        arena.transferFrom(alice, bob, beastId);
    }

    function test_AcceptChallenge_ResolvesBattleAndTransfersLoserNFT() public {
        uint256 aliceBeast = _mintAliceBeast("alice arena beast");
        uint256 bobBeast = _mintBobBeast("bob arena beast");
        uint256 challengeId = _createAliceChallenge(aliceBeast);

        vm.prank(bob);
        arena.acceptChallenge(challengeId, bobBeast);

        assertFalse(_challengeOpen(challengeId));
        assertFalse(arena.locked(aliceBeast));
        assertFalse(arena.locked(bobBeast));

        address finalOwner = arena.ownerOf(aliceBeast);
        assertEq(finalOwner, arena.ownerOf(bobBeast));
        assertTrue(finalOwner == alice || finalOwner == bob);

        _assertBattleAccounting(aliceBeast, bobBeast);
    }

    function test_AcceptChallenge_EmitsBattleResolved() public {
        uint256 aliceBeast = _mintAliceBeast("battle event alice");
        uint256 bobBeast = _mintBobBeast("battle event bob");
        uint256 challengeId = _createAliceChallenge(aliceBeast);

        vm.expectEmit(true, false, false, false, address(arena));
        emit BattleResolved(challengeId, 0, 0, address(0), address(0), 0, 0);

        vm.prank(bob);
        arena.acceptChallenge(challengeId, bobBeast);
    }

    function test_Revert_AcceptChallenge_NotBeastOwner() public {
        uint256 aliceBeast = _mintAliceBeast("alice challenge");
        uint256 bobBeast = _mintBobBeast("bob owned");
        uint256 challengeId = _createAliceChallenge(aliceBeast);

        vm.prank(charlie);
        vm.expectRevert(abi.encodeWithSelector(MonBeastArena.NotBeastOwner.selector, bobBeast));
        arena.acceptChallenge(challengeId, bobBeast);
    }

    function test_Revert_AcceptChallenge_SameBeast() public {
        uint256 aliceBeast = _mintAliceBeast("same beast");
        uint256 challengeId = _createAliceChallenge(aliceBeast);

        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(MonBeastArena.BeastLocked.selector, aliceBeast));
        arena.acceptChallenge(challengeId, aliceBeast);
    }

    function test_Revert_AcceptChallenge_ChallengeNotOpen() public {
        uint256 aliceBeast = _mintAliceBeast("closed challenge");
        uint256 bobBeast = _mintBobBeast("closed rival");
        uint256 challengeId = _createAliceChallenge(aliceBeast);

        vm.prank(alice);
        arena.cancelChallenge(challengeId);

        vm.prank(bob);
        vm.expectRevert(
            abi.encodeWithSelector(MonBeastArena.ChallengeNotOpen.selector, challengeId)
        );
        arena.acceptChallenge(challengeId, bobBeast);
    }

    function test_Revert_AcceptChallenge_MyBeastLocked() public {
        uint256 aliceBeast = _mintAliceBeast("alice open");
        uint256 bobBeast = _mintBobBeast("bob locked");
        uint256 aliceChallenge = _createAliceChallenge(aliceBeast);

        vm.prank(bob);
        arena.createChallenge(bobBeast);

        vm.prank(bob);
        vm.expectRevert(abi.encodeWithSelector(MonBeastArena.BeastLocked.selector, bobBeast));
        arena.acceptChallenge(aliceChallenge, bobBeast);
    }

    function test_SameWalletCanBattleTwoDifferentBeasts_ForDemo() public {
        uint256 beastA = _mintAliceBeast("same wallet alpha");
        uint256 beastB = _mintAliceBeast("same wallet beta");
        uint256 challengeId = _createAliceChallenge(beastA);

        vm.prank(alice);
        arena.acceptChallenge(challengeId, beastB);

        assertFalse(_challengeOpen(challengeId));
        assertEq(arena.ownerOf(beastA), alice);
        assertEq(arena.ownerOf(beastB), alice);
        _assertBattleAccounting(beastA, beastB);
    }

    function test_GetBeastsOfOwner() public {
        uint256 aliceBeastA = _mintAliceBeast("alice first");
        uint256 aliceBeastB = _mintAliceBeast("alice second");
        uint256 bobBeast = _mintBobBeast("bob first");

        uint256[] memory aliceBeasts = arena.getBeastsOfOwner(alice);
        uint256[] memory bobBeasts = arena.getBeastsOfOwner(bob);
        assertEq(aliceBeasts.length, 2);
        assertEq(bobBeasts.length, 1);
        assertEq(aliceBeasts[0], aliceBeastA);
        assertEq(aliceBeasts[1], aliceBeastB);
        assertEq(bobBeasts[0], bobBeast);

        uint256 challengeId = _createAliceChallenge(aliceBeastA);
        vm.prank(bob);
        arena.acceptChallenge(challengeId, bobBeast);

        address finalOwner = arena.ownerOf(aliceBeastA);
        aliceBeasts = arena.getBeastsOfOwner(alice);
        bobBeasts = arena.getBeastsOfOwner(bob);

        if (finalOwner == alice) {
            assertEq(aliceBeasts.length, 3);
            assertEq(bobBeasts.length, 0);
        } else {
            assertEq(aliceBeasts.length, 1);
            assertEq(bobBeasts.length, 2);
        }
    }

    function test_GetOpenChallenges_FiltersClosedChallenges() public {
        uint256 aliceBeastA = _mintAliceBeast("filter cancel");
        uint256 aliceBeastB = _mintAliceBeast("filter accept");
        uint256 aliceBeastC = _mintAliceBeast("filter keep");
        uint256 bobBeast = _mintBobBeast("filter rival");

        uint256 cancelledChallenge = _createAliceChallenge(aliceBeastA);
        uint256 acceptedChallenge = _createAliceChallenge(aliceBeastB);
        uint256 openChallenge = _createAliceChallenge(aliceBeastC);

        vm.prank(alice);
        arena.cancelChallenge(cancelledChallenge);

        vm.prank(bob);
        arena.acceptChallenge(acceptedChallenge, bobBeast);

        MonBeastArena.OpenChallenge[] memory openChallenges = arena.getOpenChallenges();
        assertEq(openChallenges.length, 1);
        assertEq(openChallenges[0].id, openChallenge);
        assertEq(openChallenges[0].beastId, aliceBeastC);
        assertEq(openChallenges[0].challenger, alice);
    }

    function test_TokenURI() public {
        string memory imageURI = "data:application/json;base64,eyJuYW1lIjoiTW9uQmVhc3QifQ==";
        uint256 beastId = _mintBeast(alice, "token uri beast", imageURI);

        assertEq(arena.tokenURI(beastId), imageURI);

        vm.expectRevert(
            abi.encodeWithSelector(MonBeastArena.BeastDoesNotExist.selector, beastId + 1)
        );
        arena.tokenURI(beastId + 1);
    }

    function test_WithdrawFees() public {
        _mintAliceBeast("fee one");
        _mintBobBeast("fee two");

        uint256 amount = 2 * arena.MINT_FEE();
        assertEq(address(arena).balance, amount);

        uint256 beforeBalance = treasury.balance;

        vm.prank(owner);
        arena.withdrawFees(payable(treasury));

        assertEq(address(arena).balance, 0);
        assertEq(treasury.balance, beforeBalance + amount);
    }

    function test_Revert_WithdrawFees_NotOwner() public {
        vm.prank(bob);
        vm.expectRevert(abi.encodeWithSelector(OwnableUnauthorizedAccount.selector, bob));
        arena.withdrawFees(payable(bob));
    }

    function test_SetTreasury() public {
        vm.expectEmit(true, false, false, true, address(arena));
        emit TreasuryUpdated(charlie);

        vm.prank(owner);
        arena.setTreasury(charlie);

        assertEq(arena.treasury(), charlie);
    }

    function test_Revert_SetTreasury_ZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert(MonBeastArena.InvalidTreasury.selector);
        arena.setTreasury(address(0));
    }

    function testFuzz_MintStatsAlwaysValid(string memory prompt) public {
        vm.assume(bytes(prompt).length > 0);
        vm.assume(bytes(prompt).length <= arena.MAX_PROMPT_LENGTH());

        uint256 beastId = _mintBeast(alice, prompt);

        _assertStatsValid(beastId);
    }

    function _mintAliceBeast(string memory prompt) internal returns (uint256) {
        return _mintBeast(alice, prompt);
    }

    function _mintBobBeast(string memory prompt) internal returns (uint256) {
        return _mintBeast(bob, prompt);
    }

    function _mintBeast(address player, string memory prompt) internal returns (uint256) {
        return _mintBeast(player, prompt, DEFAULT_IMAGE_URI);
    }

    function _mintBeast(address player, string memory prompt, string memory imageURI)
        internal
        returns (uint256)
    {
        uint256 fee = arena.MINT_FEE();

        vm.prank(player);
        return arena.mintBeast{ value: fee }(prompt, imageURI);
    }

    function _createAliceChallenge(uint256 beastId) internal returns (uint256) {
        vm.prank(alice);
        return arena.createChallenge(beastId);
    }

    function _getStatsSum(uint256 beastId) internal view returns (uint256) {
        MonBeastArena.Beast memory beast = arena.getBeast(beastId);
        return uint256(beast.atk) + beast.def + beast.hp + beast.spd;
    }

    function _assertStatsValid(uint256 beastId) internal view {
        MonBeastArena.Beast memory beast = arena.getBeast(beastId);
        assertEq(_getStatsSum(beastId), arena.STAT_TOTAL());
        assertGe(beast.atk, arena.STAT_MIN());
        assertGe(beast.def, arena.STAT_MIN());
        assertGe(beast.hp, arena.STAT_MIN());
        assertGe(beast.spd, arena.STAT_MIN());
    }

    function _assertBattleAccounting(uint256 beastA, uint256 beastB) internal view {
        MonBeastArena.Beast memory a = arena.getBeast(beastA);
        MonBeastArena.Beast memory b = arena.getBeast(beastB);

        assertEq(uint256(a.wins) + b.wins, 1);
        assertEq(uint256(a.losses) + b.losses, 1);

        if (a.wins == 1) {
            assertEq(a.level, 2);
            assertEq(b.level, 1);
        } else {
            assertEq(b.wins, 1);
            assertEq(b.level, 2);
            assertEq(a.level, 1);
        }
    }

    function _challengeOpen(uint256 challengeId) internal view returns (bool open) {
        (,,, open) = arena.challenges(challengeId);
    }

    function _stringOfLength(uint256 length) internal pure returns (string memory) {
        bytes memory buffer = new bytes(length);
        for (uint256 i = 0; i < length; i++) {
            buffer[i] = "x";
        }
        return string(buffer);
    }
}
