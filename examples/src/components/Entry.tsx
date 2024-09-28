import { Backend, ConsoleBackend, NotCCID } from '@estkme-group/notccid'
import { FC, useEffect, useMemo, useState } from 'react'
import { Col, Container, Form, Row } from 'react-bootstrap'
import { CardControl } from './CardControl'
import { Connect } from './Connect'
import { Functionally } from './Functionally'
import { useManagedNotCCID } from '../ManagedNotCCID'
import { MutexBackend } from '../MutexBackend'

export const Entry: FC = () => {
  const [backend, setBackend] = useState<Backend>()
  const wrappedBackend = useMemo(() => {
    if (!backend) return undefined
    let _backend = backend
    _backend = new ConsoleBackend(_backend, ConsoleBackend.buildOptions(printInfo, []))
    _backend = new MutexBackend(_backend)
    return _backend
  }, [backend])
  const managed = useManagedNotCCID(wrappedBackend)
  useEffect(() => {
    if (wrappedBackend === undefined) return
    Reflect.set(globalThis, 'backend', wrappedBackend)
    Reflect.set(globalThis, 'notccid', new NotCCID(wrappedBackend))
    return () => {
      Reflect.deleteProperty(globalThis, 'backend')
      Reflect.deleteProperty(globalThis, 'notccid')
    }
  }, [wrappedBackend])
  useEffect(() => {
    if (managed === undefined) return
    managed?.getStatus()
  }, [backend])
  return (
    <Container fluid>
      <Form className='mt-3'>
        <Form.Group as={Row} className='mt-3'>
          <Form.Label column sm={1}>
            Connect
          </Form.Label>
          <Col sm={11}>
            <Connect backend={backend} onChange={setBackend} />
          </Col>
        </Form.Group>
        <Form.Group as={Row} className='mt-3'>
          <Form.Label column sm={1}>
            Functionally
          </Form.Label>
          <Col sm={11}>
            <Functionally managed={managed} />
          </Col>
        </Form.Group>
        <Form.Group as={Row} className='mt-3'>
          <Form.Label column sm={1}>
            Card
          </Form.Label>
          <Col sm={11}>
            <CardControl managed={managed} />
          </Col>
        </Form.Group>
      </Form>
    </Container>
  )
}

function printInfo() {
  const args: unknown[] = Array.from(arguments)
  let argument: unknown
  for (let index = 0; index < args.length; index++) {
    argument = args[index]
    if (argument instanceof Uint8Array) {
      args[index] = toHexString(argument)
    }
  }
  console.info.apply(console, args)
}

function toHexString(data: Uint8Array): string {
  let result = ''
  for (const b of data) {
    result += b.toString(16).padStart(2, '0')
  }
  return result.toUpperCase()
}
