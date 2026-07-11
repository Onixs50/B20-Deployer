// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IB20Min {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function mint(address to, uint256 amount) external;
}

/// @title B20BatchDistributor
/// @notice Sends a B20 token to many recipients in ONE transaction (one wallet
///         signature) instead of one transaction per recipient.
///
/// Two modes:
///  1) batchTransfer — moves tokens OUT OF YOUR EXISTING BALANCE to each recipient.
///     Requires you to `approve(distributor, totalAmount)` on the token once first
///     (the dashboard does this automatically when needed).
///  2) batchMint — mints brand-new tokens directly to each recipient. Requires this
///     contract to hold MINT_ROLE on the token (grant it once from the Roles tab:
///     role = MINT_ROLE, address = this contract's address).
contract B20BatchDistributor {
    event BatchTransferred(address indexed token, address indexed from, uint256 recipients, uint256 total);
    event BatchMinted(address indexed token, uint256 recipients, uint256 total);

    error LengthMismatch();
    error EmptyBatch();

    /// @param token      the B20 token address
    /// @param recipients list of recipient addresses
    /// @param amounts    amount for each recipient (same order/length as recipients)
    function batchTransfer(
        address token,
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external {
        if (recipients.length != amounts.length) revert LengthMismatch();
        if (recipients.length == 0) revert EmptyBatch();

        uint256 total;
        for (uint256 i = 0; i < recipients.length; i++) {
            IB20Min(token).transferFrom(msg.sender, recipients[i], amounts[i]);
            total += amounts[i];
        }
        emit BatchTransferred(token, msg.sender, recipients.length, total);
    }

    /// @param token      the B20 token address (this contract must hold MINT_ROLE on it)
    /// @param recipients list of recipient addresses
    /// @param amounts    amount to mint for each recipient (same order/length)
    function batchMint(
        address token,
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external {
        if (recipients.length != amounts.length) revert LengthMismatch();
        if (recipients.length == 0) revert EmptyBatch();

        uint256 total;
        for (uint256 i = 0; i < recipients.length; i++) {
            IB20Min(token).mint(recipients[i], amounts[i]);
            total += amounts[i];
        }
        emit BatchMinted(token, recipients.length, total);
    }
}
