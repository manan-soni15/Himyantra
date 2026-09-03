const VARIANTS = {
  primary:
    'bg-ice text-[#04141d] hover:bg-ice-soft border border-ice disabled:bg-polar-raised disabled:text-[#5c6f7d] disabled:border-polar-border',
  secondary:
    'bg-transparent text-[#dbe7ee] border border-polar-borderLight hover:border-ice/50 hover:text-ice disabled:text-[#5c6f7d] disabled:border-polar-border',
  ghost:
    'bg-transparent text-[#8fa3b3] border border-transparent hover:text-ice hover:bg-white/5 disabled:text-[#5c6f7d]',
};

export default function Button({
  children,
  variant = 'primary',
  className = '',
  type = 'button',
  disabled = false,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors',
        'disabled:cursor-not-allowed',
        VARIANTS[variant] ?? VARIANTS.primary,
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </button>
  );
}
