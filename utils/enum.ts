export function isEnumValue<T extends string, TEnumValue extends string>(
  enumType: { [key in T]: TEnumValue },
  value: string
): value is TEnumValue {
  return Object.values(enumType).includes(value);
}
