function StepBar({ steps, currentStep }) {
  return (
    <div className="step-bar">
      {steps.map((label, i) => {
        const status = i < currentStep ? 'completed' : i === currentStep ? 'active' : '';
        return (
          <div key={i} className={`step-item ${status}`}>
            <div className="step-circle">
              {i < currentStep ? '✓' : i + 1}
            </div>
            <span className="step-label">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

export default StepBar;
