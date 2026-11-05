# EtherLink Smart Contracts & Assertion Tooling

This directory documents the smart contracts and assertion tooling within the repository.

## 📦 Contracts Overview

The repository includes three benchmark and testing Soroban contracts:

1. **[`amm-pool-contract`](../amm-pool-contract/)**: 
   - Constant-product automated market maker (AMM) pool contract with deposit, withdraw, swap, and cross-contract fixtures.
   - Used as the reference benchmark contract for empirical local-vs-network cost gap measurements.
2. **[`host-function-contract`](../host-function-contract/)**: 
   - Host function benchmarking contract measuring Map, Vector, Bytes, and cryptographic operations.
3. **[`bloat-contract`](../bloat-contract/)**: 
   - Minimal contract used to isolate WASM size and overhead benchmarks.

## 🛠️ Building Contracts

Ensure you have Rust and the `wasm32v1-none` target installed:

```bash
# Build AMM pool contract to WASM
cargo build -p amm-pool-contract --target wasm32v1-none --release

# Build all contracts to WASM
cargo build -p amm-pool-contract -p host-function-contract -p bloat-contract --target wasm32v1-none --release

# Run contract tests
cargo test -p amm-pool-contract
```

Or run via root npm script:
```bash
npm run build:contracts
```
