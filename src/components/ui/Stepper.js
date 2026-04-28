"use client";

export default function Stepper({ steps, currentStep }) {
  return (
    <div className="relative w-full">
      {/* Background track */}
      <div
        className="absolute top-4 left-4 right-4 h-[2px] rounded-full"
        style={{ background: "rgba(255,255,255,0.08)" }}
      />
      {/* Progress fill */}
      <div
        className="absolute top-4 left-4 h-[2px] rounded-full transition-all duration-500 ease-out"
        style={{
          background: "linear-gradient(90deg, #6366F1, #8B5CF6)",
          width: `calc(${((currentStep) / (steps.length - 1)) * 100}% - 32px)`,
          maxWidth: "calc(100% - 32px)",
        }}
      />

      {/* Step indicators */}
      <div className="relative z-10 flex justify-between w-full">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;
          const isUpcoming = index > currentStep;

          return (
            <div key={index} className="flex flex-col items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 ${
                  isCompleted
                    ? "bg-indigo-500 text-white shadow-[0_0_12px_rgba(99,102,241,0.4)]"
                    : isActive
                    ? "bg-indigo-500 text-white shadow-[0_0_12px_rgba(99,102,241,0.4)]"
                    : "border border-white/10 text-white/40"
                }`}
                style={{
                  background: isUpcoming ? "rgba(255,255,255,0.06)" : undefined,
                  boxShadow: isActive ? "0 0 0 4px var(--color-bg-primary)" : isCompleted ? "0 0 0 4px var(--color-bg-primary)" : "0 0 0 4px var(--color-bg-primary)",
                }}
              >
                {isCompleted ? (
                  <span className="material-symbols-outlined text-[16px]">check</span>
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={`text-xs font-medium whitespace-nowrap transition-colors duration-300 ${
                  isActive
                    ? "text-indigo-400"
                    : isCompleted
                    ? "text-indigo-400/70"
                    : "text-white/30"
                } ${index >= 2 ? "hidden sm:block" : ""}`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
