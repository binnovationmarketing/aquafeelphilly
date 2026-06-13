#!/usr/bin/env python3
"""
Launcher for Vite dev server.
Uses os.chdir() to set a known-valid cwd before spawning Node/npm,
bypassing the shell getcwd() failure that crashes npm when the
preview runner's initial cwd is inaccessible.
"""
import os
import subprocess
import sys

PROJECT = '/Users/rique_energy/Documents/Negocios/Aquafeel Solutions Philly/Desenvolvimento/Aquafeel Vip Proposal'

os.chdir(PROJECT)

result = subprocess.run(
    ['/usr/local/bin/npm', 'run', 'dev'],
    cwd=PROJECT,
)
sys.exit(result.returncode)
