/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useFormStatus } from "react-dom";

const SubmitButton = ({ children }: { children: any; classname: string }) => {
  const { pending } = useFormStatus();

  return <button type="submit">{pending ? <span></span> : children}</button>;
};

export default SubmitButton;
