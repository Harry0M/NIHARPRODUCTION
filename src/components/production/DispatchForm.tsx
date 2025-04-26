
import type { DispatchFormProps } from "./dispatch/form/types";
import { DispatchFormCard } from "./dispatch/form/DispatchFormCard";

export const DispatchForm = (props: DispatchFormProps) => {
  return <DispatchFormCard {...props} />;
};
