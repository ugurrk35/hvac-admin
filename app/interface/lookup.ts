export interface LookupProductAttributeValue {
  id: number
  name: string
  productAttributeId: number
}
export interface LookupProductAttribute {
  id: number
  name: string
  isPersonalization: boolean
  isPersonalizationText?: boolean
  textPrompt?: string
  maxLength?: number
  productAttributeValues: LookupProductAttributeValue[]
}
