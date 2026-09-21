"use client";

import { useEffect, useState } from "react";

// A checkbox whose checked state can change from outside the form it's in
// (e.g. the onboarding guide updating the same account setting elsewhere on
// the page) -- plain defaultChecked only applies at mount, so an
// already-mounted checkbox would silently keep showing the old value until
// a full reload. Reactively syncs whenever the server-provided value
// changes, without remounting the surrounding form (which would cut off
// SaveButton's own "Sparat" confirmation mid-display).
export default function SyncedCheckbox({
  name,
  checked,
  className,
}: {
  name: string;
  checked: boolean;
  className?: string;
}) {
  const [value, setValue] = useState(checked);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValue(checked);
  }, [checked]);

  return (
    <input
      type="checkbox"
      name={name}
      checked={value}
      onChange={(e) => setValue(e.target.checked)}
      className={className}
    />
  );
}
