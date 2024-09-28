# ESTKme-RED Diagram

## Uncontrolled RGB LED State Diagram

### General

```mermaid
stateDiagram-v2
  classDef white fill:white,color:#000
  classDef blue fill:blue,color:#fff
  classDef green fill:green,color:#000
  classDef red fill:red,color:#000
  classDef yellow fill:yellow,color:#000

  [*] --> White:::white: Booting
  White --> Red:::red: No response
  White --> Green:::green: Using USB
  White --> Yellow:::yellow: BLE Initializing
  Yellow --> Blue:::blue: Using BLE
```

### DFU Mode

Short C1 and C3 pins to enter ESTKme-RED reader DFU mode

see [Smartcard Pinout](https://en.wikipedia.org/wiki/Smart_card#/media/File:SmartCardPinout.svg) definiton

```mermaid
stateDiagram-v2
  classDef blue fill:blue,color:#fff
  classDef green fill:green,color:#000
  classDef red fill:red,color:#000

  [*] --> Blue:::blue: Enter DFU mode
  Blue --> Green:::green
  Green --> Red:::red
  Red --> Off: Erase firmware
  Off --> [*]: Entered DFU mode

  Blue --> Boot
  Green --> Boot
  Red --> Boot

  Boot --> [*]: Booting App
```
