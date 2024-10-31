import { Backend, ConsoleBackend } from '@estkme-group/notccid'
import { FC, useCallback, useMemo, useState } from 'react'
import { Button, Col, Container, Form, Row, Stack } from 'react-bootstrap'
import { useManagedNotCCID } from '../ManagedNotCCID'
import { MutexBackend } from '../MutexBackend'
import { Connect } from './Connect'

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
  const handleRecoveryMode = useCallback(async () => {
    if (!managed) return
    await managed.claim()
    await managed.powerOnCard()
    await managed.enterRecoveryMode()
  }, [managed])
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
            <Stack gap={3} direction='horizontal'>
              <Button onClick={handleRecoveryMode}>Enter Recovery Mode</Button>
            </Stack>
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
