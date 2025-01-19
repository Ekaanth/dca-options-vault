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
    "type": "enum",
    "name": "core::bool",
    "variants": [
      {
        "name": "False",
        "type": "()"
      },
      {
        "name": "True",
        "type": "()"
      }
    ]
  },
  {
    "type": "struct",
    "name": "game::Vault::VaultOption",
    "members": [
      {
        "name": "creator",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "strike_price",
        "type": "core::integer::u256"
      },
      {
        "name": "amount",
        "type": "core::integer::u256"
      },
      {
        "name": "creation_block",
        "type": "core::integer::u64"
      },
      {
        "name": "expiry_blocks",
        "type": "core::integer::u64"
      },
      {
        "name": "exercised",
        "type": "core::bool"
      },
      {
        "name": "cancelled",
        "type": "core::bool"
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
      },
      {
        "type": "function",
        "name": "create_option",
        "inputs": [
          {
            "name": "strike_price",
            "type": "core::integer::u256"
          },
          {
            "name": "expiry_blocks",
            "type": "core::integer::u64"
          },
          {
            "name": "amount",
            "type": "core::integer::u256"
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
        "name": "exercise_option",
        "inputs": [
          {
            "name": "option_id",
            "type": "core::integer::u256"
          },
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
        "name": "cancel_option",
        "inputs": [
          {
            "name": "option_id",
            "type": "core::integer::u256"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "get_option_details",
        "inputs": [
          {
            "name": "option_id",
            "type": "core::integer::u256"
          }
        ],
        "outputs": [
          {
            "type": "game::Vault::VaultOption"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_next_option_id",
        "inputs": [],
        "outputs": [
          {
            "type": "core::integer::u256"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_total_locked_amount",
        "inputs": [],
        "outputs": [
          {
            "type": "core::integer::u256"
          }
        ],
        "state_mutability": "view"
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
