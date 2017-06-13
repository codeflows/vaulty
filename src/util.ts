import * as fs from 'fs'
import * as cp from 'child_process'

export function readFile(path: string): Thenable<string> {
  return new Promise((resolve, reject) => {
    return fs.readFile(path, 'utf-8', (err, data) => {
      if (err) {
        reject(err)
      } else {
        resolve(data)
      }
    })
  })
}

export function exec(command: string): Thenable<string> {
  return new Promise((resolve, reject) => {
    cp.exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr))
      } else {
        resolve(stdout)
      }
    })
  })
}
