// WebHID API type declarations
// Not yet in TypeScript's standard lib

interface HIDDevice extends EventTarget {
  readonly opened: boolean
  readonly vendorId: number
  readonly productId: number
  readonly productName: string
  readonly collections: HIDCollectionInfo[]
  open(): Promise<void>
  close(): Promise<void>
  forget(): Promise<void>
  sendReport(reportId: number, data: BufferSource): Promise<void>
  sendFeatureReport(reportId: number, data: BufferSource): Promise<void>
  receiveFeatureReport(reportId: number): Promise<DataView>
  oninputreport: ((this: HIDDevice, ev: HIDInputReportEvent) => unknown) | null
  addEventListener(type: 'inputreport', listener: (ev: HIDInputReportEvent) => void): void
  removeEventListener(type: 'inputreport', listener: (ev: HIDInputReportEvent) => void): void
}

interface HIDInputReportEvent extends Event {
  readonly device: HIDDevice
  readonly reportId: number
  readonly data: DataView
}

interface HIDCollectionInfo {
  usagePage?: number
  usage?: number
  type?: number
  children?: HIDCollectionInfo[]
  inputReports?: HIDReportInfo[]
  outputReports?: HIDReportInfo[]
  featureReports?: HIDReportInfo[]
}

interface HIDReportInfo {
  reportId?: number
  items?: HIDReportItem[]
}

interface HIDReportItem {
  isAbsolute?: boolean
  isArray?: boolean
  isRange?: boolean
  hasNull?: boolean
  usages?: number[]
  usageMinimum?: number
  usageMaximum?: number
  reportSize?: number
  reportCount?: number
  unitExponent?: number
  unitSystem?: string
  unitFactorMassExponent?: number
  unitFactorLengthExponent?: number
  unitFactorTimeExponent?: number
  unitFactorTemperatureExponent?: number
  unitFactorCurrentExponent?: number
  unitFactorLuminousIntensityExponent?: number
  logicalMinimum?: number
  logicalMaximum?: number
  physicalMinimum?: number
  physicalMaximum?: number
  strings?: string[]
}

interface HIDDeviceFilter {
  vendorId?: number
  productId?: number
  usagePage?: number
  usage?: number
}

interface HIDDeviceRequestOptions {
  filters: HIDDeviceFilter[]
}

interface HID extends EventTarget {
  getDevices(): Promise<HIDDevice[]>
  requestDevice(options: HIDDeviceRequestOptions): Promise<HIDDevice[]>
}

interface Navigator {
  readonly hid: HID
}
