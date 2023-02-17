import { Alert } from "@mui/material";

const Notification = () => {
  return (
    <Alert sx={{ margin: "20px 0" }} severity="success" color="success">
      This is a success alert — check it out!
    </Alert>
  );
};

export default Notification;
