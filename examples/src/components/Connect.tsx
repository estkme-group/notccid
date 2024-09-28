import { Backend, WebBLEBackend, WebUSBBackend } from '@estkme-group/notccid'
import { FC, useCallback, useState } from 'react'
import { Button, Stack } from 'react-bootstrap'

interface ConnectProps {
  readonly backend: Backend | undefined
  onChange(backend: this['backend']): void
}

export const Connect: FC<ConnectProps> = ({ backend, onChange }) => {
  const [error, setError] = useState<Error>()
  const handleUSB = useCallback(async () => {
    try {
      if (backend) await backend.close()
      const device = await WebUSBBackend.requestDevice()
      onChange(await WebUSBBackend.open(device))
      setError(undefined)
    } catch (error) {
      console.error(error)
      if (error instanceof Error) {
        setError(error)
      }
    }
  }, [backend, onChange])
  const handleBLE = useCallback(async () => {
    try {
      if (backend) await backend.close()
      const device = await WebBLEBackend.requestDevice()
      onChange(await WebBLEBackend.open(device))
      setError(undefined)
    } catch (error) {
      console.error(error)
      if (error instanceof Error) {
        setError(error)
      }
    }
  }, [backend, onChange])
  const handleClose = useCallback(async () => {
    if (backend) await backend.close()
    onChange(undefined)
  }, [backend, onChange])
  let indicator
  if (backend === undefined) {
    indicator = <span>No device selected</span>
  } else if (error) {
    indicator = <span>{error.message}</span>
  } else {
    indicator = <span>Selected ({backend.toString()})</span>
  }
  return (
    <>
      <Stack gap={3} direction='horizontal'>
        <Button disabled={backend !== undefined || !('usb' in navigator)} onClick={handleUSB}>
          Open WebUSB
        </Button>
        <Button disabled={backend !== undefined || !('bluetooth' in navigator)} onClick={handleBLE}>
          Open WebBLE
        </Button>
        <Button disabled={backend === undefined} onClick={handleClose}>
          Close
        </Button>
        {indicator}
      </Stack>
    </>
  )
}
