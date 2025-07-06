import { describe, it, expect } from 'vitest'

describe('Basic Test', () => {
  it('should work', () => {
    expect(1 + 1).toBe(2)
  })
  
  it('should test string operations', () => {
    expect('hello world').toContain('world')
    expect('hello world'.length).toBe(11)
  })
  
  it('should test array operations', () => {
    const arr = [1, 2, 3, 4, 5]
    expect(arr).toHaveLength(5)
    expect(arr).toContain(3)
    expect(arr.filter(x => x > 2)).toEqual([3, 4, 5])
  })
  
  it('should test object operations', () => {
    const obj = { name: 'John', age: 30 }
    expect(obj).toHaveProperty('name')
    expect(obj.name).toBe('John')
    expect(obj).toEqual({ name: 'John', age: 30 })
  })
})
