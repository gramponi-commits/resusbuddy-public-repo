interface CommandBannerProps {
  message: string;
  priority: 'critical' | 'warning' | 'info' | 'success';
  subMessage?: string;
}

export function CommandBanner({ message, subMessage }: CommandBannerProps) {
  return (
    <div className="w-full px-4 py-3 text-center">
      <h1 className="text-lg md:text-xl font-semibold text-foreground">{message}</h1>
      {subMessage && (
        <p className="text-xs md:text-sm mt-0.5 text-muted-foreground">{subMessage}</p>
      )}
    </div>
  );
}
