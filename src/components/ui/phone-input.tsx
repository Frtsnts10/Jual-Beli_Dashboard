import React, { useState, useEffect } from "react";
import { Input } from "@heroui/react";
import { ChevronDown } from "lucide-react";
import { COUNTRY_CODES } from "@/config/countries";

interface PhoneInputProps {
  label?: string;
  value: string;
  onChange: (val: string) => void;
  variant?: "flat" | "bordered" | "faded" | "underlined";
  radius?: "none" | "sm" | "md" | "lg" | "full";
  classNames?: any;
  labelPlacement?: "inside" | "outside" | "outside-left";
  isRequired?: boolean;
  placeholder?: string;
}

export function PhoneInput({
  label = "Phone Number",
  value,
  onChange,
  variant = "bordered",
  radius = "md",
  classNames,
  labelPlacement = "outside",
  isRequired = false,
  placeholder = "812-3456-7890",
}: PhoneInputProps) {
  // Parse initial value to extract country code and phone part
  const [countryCode, setCountryCode] = useState("+62");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isOpenCountry, setIsOpenCountry] = useState(false);

  useEffect(() => {
    if (!value) {
      setPhoneNumber("");
      return;
    }
    const match = value.match(/^(\\+\\d+)\\s+(.*)$/);
    if (match) {
      setCountryCode(match[1]);
      setPhoneNumber(match[2].replace(/^0+/, ""));
    } else {
      // If it doesn't match the format, just assume it's all phone number
      if (value.startsWith("+")) {
        const spaceIdx = value.indexOf(" ");
        if (spaceIdx > -1) {
          setCountryCode(value.substring(0, spaceIdx));
          setPhoneNumber(value.substring(spaceIdx + 1).replace(/^0+/, ""));
        } else {
          setPhoneNumber(value.replace(/^0+/, ""));
        }
      } else {
        setPhoneNumber(value.replace(/^0+/, ""));
      }
    }
  }, [value]);

  const handlePhoneChange = (val: string) => {
    const strippedVal = val.replace(/^0+/, "");
    setPhoneNumber(strippedVal);
    onChange(`${countryCode} ${strippedVal.trim()}`);
  };

  const handleCountryChange = (code: string) => {
    setCountryCode(code);
    setIsOpenCountry(false);
    onChange(`${code} ${phoneNumber.trim()}`);
  };

  const activeCountry = COUNTRY_CODES.find((c) => c.code === countryCode) || COUNTRY_CODES[0];

  const startContent = (
    <div className="relative flex items-center pr-2 border-r border-slate-200 dark:border-slate-800">
      <button
        type="button"
        onClick={() => setIsOpenCountry(!isOpenCountry)}
        className="flex items-center gap-1.5 px-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
      >
        <span className="text-sm">{activeCountry.flag}</span>
        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
          {countryCode}
        </span>
        <ChevronDown
          className={`w-3 h-3 text-slate-400 transition-transform ${
            isOpenCountry ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpenCountry && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpenCountry(false)}
          />
          <div className="absolute top-[120%] left-0 z-50 w-64 max-h-56 overflow-y-auto bg-white dark:bg-[#0d1322] border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl py-1">
            {COUNTRY_CODES.map((item) => {
              const isSelected = item.code === countryCode;
              return (
                <button
                  key={item.code + item.country}
                  type="button"
                  onClick={() => handleCountryChange(item.code)}
                  className={`w-full px-3 py-1.5 text-left text-xs flex items-center gap-2.5 hover:bg-slate-50 dark:hover:bg-[#131b2e] transition-colors ${
                    isSelected
                      ? "bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 font-bold"
                      : "text-slate-700 dark:text-slate-300 font-medium"
                  }`}
                >
                  <span className="text-sm">{item.flag}</span>
                  <span className="font-bold w-10 shrink-0">{item.code}</span>
                  <span className="text-slate-500 dark:text-slate-400 truncate">
                    {item.country}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );

  return (
    <Input
      label={label}
      labelPlacement={labelPlacement}
      placeholder={placeholder}
      isRequired={isRequired}
      value={phoneNumber}
      onValueChange={handlePhoneChange}
      variant={variant}
      radius={radius}
      classNames={classNames}
      startContent={startContent}
    />
  );
}
