import type { Abi } from "starknet";

export const VAULT_CONTRACT_ABI = [
    {
      "type": "impl",
      "name": "SimpleVault",
      "interface_name": "game::Vault::ISimpleVault"
    },
    {
      "type": "struct",
      "name": "core::integer::u256",
      "members": [
        {
          "name": "low",
          "type": "core::integer::u128"
        },
        {
          "name": "high",
          "type": "core::integer::u128"
        }
      ]
    },
    {
      "type": "interface",
      "name": "game::Vault::ISimpleVault",
      "items": [
        {
          "type": "function",
          "name": "deposit",
          "inputs": [
            {
              "name": "amount",
              "type": "core::integer::u256"
            }
          ],
          "outputs": [],
          "state_mutability": "external"
        },
        {
          "type": "function",
          "name": "withdraw",
          "inputs": [
            {
              "name": "shares",
              "type": "core::integer::u256"
            }
          ],
          "outputs": [],
          "state_mutability": "external"
        },
        {
          "type": "function",
          "name": "user_balance_of",
          "inputs": [
            {
              "name": "account",
              "type": "core::starknet::contract_address::ContractAddress"
            }
          ],
          "outputs": [
            {
              "type": "core::integer::u256"
            }
          ],
          "state_mutability": "external"
        },
        {
          "type": "function",
          "name": "contract_total_supply",
          "inputs": [],
          "outputs": [
            {
              "type": "core::integer::u256"
            }
          ],
          "state_mutability": "external"
        }
      ]
    },
    {
      "type": "constructor",
      "name": "constructor",
      "inputs": [
        {
          "name": "token",
          "type": "core::starknet::contract_address::ContractAddress"
        }
      ]
    },
    {
      "type": "event",
      "name": "game::Vault::SimpleVault::Event",
      "kind": "enum",
      "variants": []
    }
  ] as const satisfies Abi; 
