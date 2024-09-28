import { FC, useCallback, useMemo, useState } from 'react'
import { Button, Col, Form, InputGroup, Row, Stack } from 'react-bootstrap'
import { ManagedNotCCID } from '../ManagedNotCCID'

interface Props {
  managed: ManagedNotCCID | undefined
}

export const CardControl: FC<Props> = ({ managed }) => {
  const connected = useMemo(() => managed?.connected ?? false, [managed])
  return (
    <>
      <PowerManager managed={managed} />
      <InputGroup className='mt-3'>
        <InputGroup.Text>ATR</InputGroup.Text>
        <Form.Control disabled={!connected} readOnly value={managed?.atr ? toHexString(managed.atr) : ''} />
      </InputGroup>
      <Form.Text muted>
        Open <ATRParser atr={managed?.atr} />
      </Form.Text>
      <APDUCommand managed={managed} disabled={!connected} />
      <Form.Text muted>Please open developer tools, see console logging</Form.Text>
    </>
  )
}

const PowerManager: FC<Props> = ({ managed }) => {
  const connected = useMemo(() => managed?.connected ?? false, [managed])
  const claimed = useMemo(() => managed?.claimed ?? false, [managed])
  const powered = useMemo(() => managed?.powered ?? false, [managed])
  const disabled = !connected || !claimed
  return (
    <Stack gap={3} direction='horizontal'>
      <Button disabled={disabled || powered} onClick={() => managed?.powerOnCard({ negotiation: true })}>
        Power On
      </Button>
      <Button disabled={disabled || powered} onClick={() => managed?.powerOnCard({ negotiation: false })}>
        Power On (No PPS)
      </Button>
      <Button disabled={disabled || !powered} onClick={() => managed?.powerOffCard()}>
        Power Off
      </Button>
    </Stack>
  )
}

interface APDUCommandProps {
  readonly managed: ManagedNotCCID | undefined
  readonly disabled: boolean
}

const APDUCommand: FC<APDUCommandProps> = ({ managed, disabled }) => {
  const [request, setRequest] = useState('')
  const requestData = useMemo(() => request && fromHexString(request), [request])
  const handleSend = useCallback(async () => {
    if (!managed || !requestData) return
    await managed?.transmit(requestData)
  }, [managed, requestData])
  return (
    <InputGroup className='mt-3'>
      <InputGroup.Text>Request</InputGroup.Text>
      <Form.Control
        type='text'
        disabled={disabled}
        value={request}
        onChange={(event) => setRequest(event.target.value)}
      />
      <Button disabled={disabled || !requestData} onClick={handleSend}>
        Send
      </Button>
    </InputGroup>
  )
}

interface ATRParserProps {
  readonly atr?: Uint8Array
}

const ATRParser: FC<ATRParserProps> = ({ atr }) => {
  const atrParserURL = useMemo(() => {
    const parser = new URL('https://smartcard-atr.apdu.fr/parse')
    if (!atr) return parser.toString()
    parser.searchParams.set('ATR', toHexString(atr))
    return parser.toString()
  }, [atr])
  return (
    <a target='_blank' href={atrParserURL}>
      ATR Parser
    </a>
  )
}

function toHexString(data: Uint8Array): string {
  let result = ''
  for (const b of data) {
    result += b.toString(16).padStart(2, '0')
  }
  return result.toUpperCase()
}

function fromHexString(input: string): Uint8Array | undefined {
  if (input.length % 2 !== 0) return
  const data = new Uint8Array(input.length / 2)
  for (let index = 0; index < input.length; index += 2) {
    data[index / 2] = Number.parseInt(input.slice(index, index + 2), 16)
  }
  return data
}
