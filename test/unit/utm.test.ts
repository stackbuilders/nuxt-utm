import { describe, it, expect } from 'vitest'
import type { LocationQuery } from 'vue-router'
import { getGCLID } from '../../src/runtime/utm'
import type { GCLIDParams } from 'nuxt-utm'

describe('getGCLID', () => {
  it('should return GCLID and gad_source when both are present in query', () => {
    const query: LocationQuery = {
      gclid: 'testGclid123',
      gad_source: 'testGadSourceABC',
    }
    const expected: GCLIDParams = {
      gclid: 'testGclid123',
      gad_source: 'testGadSourceABC',
    }
    expect(getGCLID(query)).toEqual(expected)
  })

  it('should return only gclid when gad_source is not present', () => {
    const query: LocationQuery = {
      gclid: 'testGclid123',
    }
    const expected: GCLIDParams = {
      gclid: 'testGclid123',
      gad_source: undefined,
    }
    expect(getGCLID(query)).toEqual(expected)
  })

  it('should return only gad_source when gclid is not present', () => {
    const query: LocationQuery = {
      gad_source: 'testGadSourceABC',
    }
    const expected: GCLIDParams = {
      gclid: undefined,
      gad_source: 'testGadSourceABC',
    }
    expect(getGCLID(query)).toEqual(expected)
  })

  it('should return undefined for both when neither gclid nor gad_source is present', () => {
    const query: LocationQuery = {}
    const expected: GCLIDParams = {
      gclid: undefined,
      gad_source: undefined,
    }
    expect(getGCLID(query)).toEqual(expected)
  })

  it('should return empty strings if query parameters are empty strings', () => {
    const query: LocationQuery = {
      gclid: '',
      gad_source: '',
    }
    const expected: GCLIDParams = {
      gclid: '',
      gad_source: '',
    }
    expect(getGCLID(query)).toEqual(expected)
  })

  it('should handle gclid present and gad_source as empty string', () => {
    const query: LocationQuery = {
      gclid: 'testGclid123',
      gad_source: '',
    }
    const expected: GCLIDParams = {
      gclid: 'testGclid123',
      gad_source: '',
    }
    expect(getGCLID(query)).toEqual(expected)
  })

  it('should handle gad_source present and gclid as empty string', () => {
    const query: LocationQuery = {
      gclid: '',
      gad_source: 'testGadSourceABC',
    }
    const expected: GCLIDParams = {
      gclid: '',
      gad_source: 'testGadSourceABC',
    }
    expect(getGCLID(query)).toEqual(expected)
  })

  it('should handle query parameters with special characters', () => {
    const query: LocationQuery = {
      gclid: 'gclid-123_abc!@#',
      gad_source: 'gad_source-XYZ*%^',
    }
    const expected: GCLIDParams = {
      gclid: 'gclid-123_abc!@#',
      gad_source: 'gad_source-XYZ*%^',
    }
    expect(getGCLID(query)).toEqual(expected)
  })

  it('should handle query parameters that are numbers (as strings)', () => {
    const query: LocationQuery = {
      gclid: '12345',
      gad_source: '67890',
    }
    const expected: GCLIDParams = {
      gclid: '12345',
      gad_source: '67890',
    }
    expect(getGCLID(query)).toEqual(expected)
  })

  it('should handle null values for query parameters', () => {
    const query: LocationQuery = {
      gclid: null,
      gad_source: null,
    }
    const expected: GCLIDParams = {
      gclid: undefined,
      gad_source: undefined,
    }
    expect(getGCLID(query)).toEqual(expected)
  })

  it('should handle one param as null and other present', () => {
    const query: LocationQuery = {
      gclid: 'testGclid123',
      gad_source: null,
    }
    const expected: GCLIDParams = {
      gclid: 'testGclid123',
      gad_source: undefined,
    }
    expect(getGCLID(query)).toEqual(expected)
  })

  it('should convert array query parameters to comma-separated strings', () => {
    const query: LocationQuery = {
      gclid: ['testGclid123', 'anotherGclid'],
      gad_source: ['testGadSourceABC', 'anotherGadSource'],
    }
    const expected: GCLIDParams = {
      gclid: 'testGclid123,anotherGclid',
      gad_source: 'testGadSourceABC,anotherGadSource',
    }
    expect(getGCLID(query)).toEqual(expected)
  })

  it('should handle mixed types of query parameters (string and array)', () => {
    const query: LocationQuery = {
      gclid: 'testGclid123',
      gad_source: ['testGadSourceABC', 'anotherGadSource'],
    }
    const expected: GCLIDParams = {
      gclid: 'testGclid123',
      gad_source: 'testGadSourceABC,anotherGadSource',
    }
    expect(getGCLID(query)).toEqual(expected)
  })
})
