import { FC, useCallback, useMemo } from 'react'
import { Button, Form, Stack } from 'react-bootstrap'
import { ManagedNotCCID } from '../ManagedNotCCID'

interface FunctionallyProps {
  readonly managed: ManagedNotCCID | undefined
}

export const Functionally: FC<FunctionallyProps> = ({ managed }) => {
  const connected = useMemo(() => managed?.connected ?? false, [managed])
  const claimed = useMemo(() => managed?.claimed ?? false, [managed])
  const handleGetStatus = useCallback(async () => {
    if (!managed) return
    console.log(await managed.getStatus())
  }, [managed])
  return (
    <Stack gap={3} direction='horizontal'>
      <Button disabled={!connected || claimed} onClick={() => managed?.claim()}>
        Claim
      </Button>
      <Button disabled={!connected || !claimed} onClick={() => managed?.release()}>
        Release
      </Button>
      <Button disabled={!connected} onClick={handleGetStatus}>
        Get Status
      </Button>
      <Button disabled={!connected} onClick={() => managed?.echo(crypto.getRandomValues(new Uint8Array(0x100)))}>
        Ping
      </Button>
      <Form.Control
        disabled={!connected}
        type='color'
        onInput={(event) => managed?.emitLED(event.currentTarget.value)}
      />
      <Button disabled={!connected} onClick={() => managed?.emitLED()}>
        LED OFF
      </Button>
    </Stack>
  )
}
