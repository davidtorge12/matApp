import { Alert } from "@mui/material";

const Notification = ({ text, color }: { text?: string; color?: string }) => {
  if (!text) {
    return null;
  }

  return (
    <Alert
      sx={{ margin: "20px 0", position: "fixed", top: 0 }}
      severity="success"
      color="success"
    >
      {text}
    </Alert>
  );
};

export default Notification;
