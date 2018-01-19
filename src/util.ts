import * as fs from 'fs'
import * as cp from 'child_process'

export function isFileAccessible(path: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    return fs.access(path, err => (err ? resolve(false) : resolve(true)))
  })
}

export function readFile(path: string): Promise<string> {
  return new Promise((resolve, reject) => {
    return fs.readFile(path, 'utf-8', (err, data) => (err ? reject(err) : resolve(data)))
  })
}

export function exec(command: string, args?: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    cp.execFile(command, args, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr))
      } else {
        resolve(stdout)
      }
    })
  })
}
