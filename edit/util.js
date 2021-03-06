'use strict';

function dirtyReporter() {
  const dirty = new Map();
  const onchanges = [];

  function add(obj, value) {
    const saved = dirty.get(obj);
    if (!saved) {
      dirty.set(obj, {type: 'add', newValue: value});
    } else if (saved.type === 'remove') {
      if (saved.savedValue === value) {
        dirty.delete(obj);
      } else {
        saved.newValue = value;
        saved.type = 'modify';
      }
    }
  }

  function remove(obj, value) {
    const saved = dirty.get(obj);
    if (!saved) {
      dirty.set(obj, {type: 'remove', savedValue: value});
    } else if (saved.type === 'add') {
      dirty.delete(obj);
    } else if (saved.type === 'modify') {
      saved.type = 'remove';
    }
  }

  function modify(obj, oldValue, newValue) {
    const saved = dirty.get(obj);
    if (!saved) {
      if (oldValue !== newValue) {
        dirty.set(obj, {type: 'modify', savedValue: oldValue, newValue});
      }
    } else if (saved.type === 'modify') {
      if (saved.savedValue === newValue) {
        dirty.delete(obj);
      } else {
        saved.newValue = newValue;
      }
    } else if (saved.type === 'add') {
      saved.newValue = newValue;
    }
  }

  function clear(obj) {
    if (obj === undefined) {
      dirty.clear();
    } else {
      dirty.delete(obj);
    }
  }

  function isDirty() {
    return dirty.size > 0;
  }

  function onChange(cb) {
    // make sure the callback doesn't throw
    onchanges.push(cb);
  }

  function wrap(obj) {
    for (const key of ['add', 'remove', 'modify', 'clear']) {
      obj[key] = trackChange(obj[key]);
    }
    return obj;
  }

  function emitChange() {
    for (const cb of onchanges) {
      cb();
    }
  }

  function trackChange(fn) {
    return function () {
      const dirty = isDirty();
      const result = fn.apply(null, arguments);
      if (dirty !== isDirty()) {
        emitChange();
      }
      return result;
    };
  }

  function has(key) {
    return dirty.has(key);
  }

  return wrap({add, remove, modify, clear, isDirty, onChange, has});
}
