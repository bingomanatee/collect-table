import { create } from '@wonderlandlabs/collect';
import type { changeObj, baseObj, mapCollection } from './types';
import { changePhases } from './constants';

/**
 * a wrapper for a single pending change.
 * Allows for rolling through phases during an update.
 */
export class Change implements changeObj {
  time: number;

  base: baseObj;

  phase: changePhases;

  public backupTables = create(new Map<string, mapCollection>());

  saveTableBackup (name, store) {
    // @TODO: throw if exists?
    this.backupTables.set(name, store);
  }

  applyBackups () {
    this.backupTables.forEach((table, name) => {
      this.base.restoreTable(name, table);
    });
  }

  error: any;

  get isActive () {
    return [
      changePhases.new,
      changePhases.started,
      changePhases.validated
    ].includes(this.phase);
  }

  get isLive () {
    return [changePhases.new, changePhases.started].includes(this.phase);
  }

  get isFailed () {
    return this.phase === changePhases.failed;
  }

  constructor (changes: baseObj) {
    this.time = changes.next;
    this.base = changes;
    this.phase = changePhases.started;
  }

  start () {
    if (!this.isLive) {
      return;
    }
    this.phase = changePhases.started;
    this.base.emit('change-started', this);
  }

  executed () {
    if (!this.isLive) {
      return;
    }
    this.phase = changePhases.executed;
    this.base.emit('change-executed', this);
  }

  completed () {
    if (!this.isFailed) {
      this.phase = changePhases.complete;
      this.base.emit('change-complete', this);
    }
  }

  validated () {
    if (!this.isActive) {
      return;
    }
    this.phase = changePhases.validated;
    this.base.emit('change-validated', this);
  }

  failed (err: any) {
    if (!this.isActive) {
      return;
    }
    this.error = err;
    this.phase = changePhases.failed;
    this.base.emit('change-failed', this);
  }
}
