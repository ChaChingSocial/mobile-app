import {
  Select as BaseSelect,
  SelectTrigger,
  SelectInput,
  SelectIcon,
  SelectPortal,
  SelectBackdrop,
  SelectContent,
  SelectDragIndicator,
  SelectDragIndicatorWrapper,
  SelectItem,
} from "@/components/ui/select";
import { ChevronDownIcon } from "@/components/ui/icon";

interface Option {
  value: string;
  label: string;
  disabled?: boolean;
}

export default function SelectComponent({
  options,
  value,
  onValueChange,
  placeholder = "Select option",
  triggerClassName = "",
  contentClassName = "",
  inputClassName = "",
  iconClassName = "",
  ...props
}: {
  options: Option[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  triggerClassName?: string;
  contentClassName?: string;
  inputClassName?: string;
  iconClassName?: string;
  [key: string]: any;
}) {
  return (
    <BaseSelect onValueChange={onValueChange} {...props}>
      <SelectTrigger variant="outline" size="md" className={triggerClassName}>
        <SelectInput
          value={value}
          placeholder={placeholder}
          className={inputClassName}
        />
        <SelectIcon className={iconClassName} as={ChevronDownIcon} />
      </SelectTrigger>
      <SelectPortal>
        <SelectBackdrop />
        <SelectContent className={contentClassName}>
          <SelectDragIndicatorWrapper>
            <SelectDragIndicator />
          </SelectDragIndicatorWrapper>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              label={option.label}
              value={option.value}
              isDisabled={option.disabled}
            />
          ))}
        </SelectContent>
      </SelectPortal>
    </BaseSelect>
  );
}
