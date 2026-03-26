import { toast } from "react-toastify";

export const toastSuccess = (message, options = {}) => {
  toast.success(message, options);
};

export const toastError = (message, options = {}) => {
  toast.error(message, options);
};

export const toastInfo = (message, options = {}) => {
  toast.info(message, options);
};

export const toastWarn = (message, options = {}) => {
  toast.warn(message, options);
};
