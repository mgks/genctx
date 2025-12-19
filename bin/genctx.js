#!/usr/bin/env node

const { run } = require('../src/main');

run().catch(err => {
    console.error("\n❌ An unexpected error occurred:", err);
    process.exit(1);
});