import React, { useEffect, useState } from "react";

const Timer = ({ duration, onFinish }) => {
  const [time, setTime] = useState(duration);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [onFinish]);

  return (
    <div className="text-xl font-semibold text-red-600">
      Timp rămas: {time} secunde
    </div>
  );
};

export default Timer;
