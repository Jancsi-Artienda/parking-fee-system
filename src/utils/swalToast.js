import Swal from "sweetalert2";

const toast = Swal.mixin({
  toast: true,
  position: "top-center",
  icon: "success",
  timer: 1500,
  showConfirmButton: false,
  didOpen: (popup) => {
    popup.addEventListener("mouseenter", Swal.stopTimer);
    popup.addEventListener("mouseleave", Swal.resumeTimer);
  },
});

export const toastSuccess = (title) => toast.fire({ icon: "success", title });
export const toastError = (title) => toast.fire({ icon: "error", title });
export const toastWarning = (title) => toast.fire({ icon: "warning", title });
