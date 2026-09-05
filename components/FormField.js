export function FieldLabel({ children, htmlFor }) {
  return (
    <label htmlFor={htmlFor} className="block text-xs text-[#8fa3b3] mb-1.5">
      {children}
    </label>
  );
}

const fieldClasses =
  'w-full rounded-md border border-polar-border bg-polar-raised px-3 py-2.5 text-sm text-[#dbe7ee] placeholder:text-[#4d5f6d] focus:border-ice/50 outline-none transition-colors';

export function TextField({ id, label, placeholder, type = "text", ...props }) {
  return (
    <div>
      {label && <FieldLabel htmlFor={id}>{label}</FieldLabel>}
      <input id={id} type={type} placeholder={placeholder} className={fieldClasses} {...props} />
    </div>
  );
}

export function SelectField({ id, label, options = [], ...props }) {
  return (
    <div>
      {label && <FieldLabel htmlFor={id}>{label}</FieldLabel>}
      <select id={id} className={`${fieldClasses} appearance-none`} {...props}>
        {options.map((opt) => (
          <option key={opt.value ?? opt} value={opt.value ?? opt} className="bg-[#0b131e] text-[#dbe7ee] py-2">
            {opt.label ?? opt}
          </option>
        ))}
      </select>
    </div>
  );
}
