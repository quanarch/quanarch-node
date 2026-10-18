import fs from 'node:fs';
import type { QuanSource } from '../../types';
import { appConfig } from '../app-config';

/** The quans this quanar loads. The list lives outside the code, in data/quans.json. */
export function readQuanSources(): QuanSource[] {
  try {
    return JSON.parse(fs.readFileSync(appConfig.quansFile, 'utf8')) as QuanSource[];
  } catch {
    return [];
  }
}
