#!/bin/bash
sed -i 's/export interface UserProfile {/export interface UserProfile {\n  department?: string;\n  status?: string;/g' src/types.ts
