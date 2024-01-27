import React, { useEffect, useState } from "react";
import { IconButton } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import Notification from "./Notification";

function CopyButton({
    materials,
    prices,
    total,
    address,
    str,
    txt,
    units,
    keyT,
}: {
    materials?: string[];
    prices?: number[];
    units?: number[];
    total?: number;
    address?: string;
    str?: string;
    txt?: string;
    keyT?: string;
}) {
    const [time, setTime] = useState(false);

    useEffect(() => {
        if (time) {
            setTimeout(() => {
                setTime(false);
            }, 3000);
        }
    });

    return (
        <div key={keyT}>
            <IconButton
                disabled={time}
                size='small'
                color='primary'
                onClick={() => {
                    if (str) {
                        setTime(true);
                        return navigator.clipboard.writeText(str);
                    }

                    let allMaterialsList = "";
                    if (address) {
                        allMaterialsList += address;
                    }

                    if (materials) {
                        if (prices) {
                            materials.map((m, i) => {
                                if (units && units[i]) {
                                    allMaterialsList += `${units[i]}x ${m.padEnd(45, ".")} ${prices[i]} £ \n`;
                                } else {
                                    allMaterialsList += m.padEnd(45, ".") + " " + prices[i] + " £" + "\n";
                                }
                            });
                            if (total) {
                                allMaterialsList += `\nTotal: ${total} £ \n`;
                            }
                        } else {
                            materials.map((m, i) => {
                                if (units && units[i]) {
                                    allMaterialsList += `${units[i]}x  ${m}` + "\n";
                                } else {
                                    allMaterialsList += m + "\n";
                                }
                            });
                        }
                    }

                    navigator.clipboard.writeText(allMaterialsList);
                    setTime(true);
                }}
            >
                <ContentCopyIcon />
                {txt ? <p>{txt}</p> : null}
            </IconButton>
            {time && <Notification text='Text successful copied' />}
        </div>
    );
}

export default CopyButton;
