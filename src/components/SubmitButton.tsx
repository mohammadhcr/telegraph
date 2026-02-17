/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useFormStatus } from "react-dom";
import "../styles/Button.scss";

const SubmitButton = ({
  children,
  classname,
}: {
  children: any;
  classname: string;
}) => {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className={classname}>
      {pending ? <span className="btnLoader"></span> : children}
    </button>
  );
};

export default SubmitButton;
