import type { Abi } from "starknet";

export const VAULT_CONTRACT_ABI = [
  {
    "name": "SimpleVault",
    "type": "impl",
    "interface_name": "game::Vault::ISimpleVault"
  },
  {
    "name": "core::integer::u256",
    "type": "struct",
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
    "name": "core::bool",
    "type": "enum",
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
    "name": "game::Vault::VaultOption",
    "type": "struct",
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
    "name": "game::Vault::ISimpleVault",
    "type": "interface",
    "items": [
      {
        "name": "deposit",
        "type": "function",
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
        "name": "withdraw",
        "type": "function",
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
        "name": "user_balance_of",
        "type": "function",
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
        "name": "contract_total_supply",
        "type": "function",
        "inputs": [],
        "outputs": [
          {
            "type": "core::integer::u256"
          }
        ],
        "state_mutability": "external"
      },
      {
        "name": "create_option",
        "type": "function",
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
        "name": "exercise_option",
        "type": "function",
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
        "name": "cancel_option",
        "type": "function",
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
        "name": "get_option_details",
        "type": "function",
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
        "name": "get_next_option_id",
        "type": "function",
        "inputs": [],
        "outputs": [
          {
            "type": "core::integer::u256"
          }
        ],
        "state_mutability": "view"
      },
      {
        "name": "get_total_locked_amount",
        "type": "function",
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
    "name": "constructor",
    "type": "constructor",
    "inputs": [
      {
        "name": "token",
        "type": "core::starknet::contract_address::ContractAddress"
      }
    ]
  },
  {
    "kind": "enum",
    "name": "game::Vault::SimpleVault::Event",
    "type": "event",
    "variants": []
  }
] as const satisfies Abi; 
