import { Action, ActionPanel, Form, getPreferenceValues, LocalStorage, showToast, Toast, } from "@raycast/api";
import { useForm } from "@raycast/utils";
import { useEffect, useRef, useState } from "react";
import { getImageKeys, init, setActivity } from "../scripts/setRichPresence";


interface SetPresenceFormValues {
  state: string;
  type: string;
  displayType: string;
  details: string;
  stateUrl?: string;
  detailsUrl?: string;
  activityUrl?: string;
  button1Label: string;
  button1Url: string;
  button2Label: string;
  button2Url: string;
  startTimestamp?: Date | null;
  endTimestamp?: Date | null;
  largeImageKey?: string;
  smallImageKey?: string;
  largeImageText?: string;
  smallImageText?: string;
}

function validateUrl(url: string | undefined) {
  if (url && !(url.startsWith("http://") || url.startsWith("https://"))) return "URL must start with 'http://' or 'https://'";
}

function validateMinMax(v: string | undefined, min?: number, max?: number) {
  if (v && min && v.length < min) return `Value must be at least ${min}`;
  if (v && max && v.length > max) return `Value must be at most ${max}`;
}

function validateRequired(v: string | undefined) {
  if (!v) return "Required";
}

export default function Command() {
  const [imageKeys, setImageKeys] = useState<string[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { handleSubmit, itemProps, values, reset } = useForm<SetPresenceFormValues>({
    onSubmit() {
      const buttons: { label: string, url: string }[] = [];
      if (values.button1Label) {
        buttons.push({
          label: values.button1Label,
          url: values.button1Url
        })
      }
      if (values.button2Label) {
        buttons.push({
          label: values.button2Label,
          url: values.button2Url
        })
      }

      const success = setActivity({
        state: values.state,
        details: values.details,
        type: Number(values.type),
        statusDisplayType: Number(values.displayType),
        startTimestamp: values.startTimestamp ? values.startTimestamp.getTime() / 1000 : undefined,
        endTimestamp: values.endTimestamp ? values.endTimestamp.getTime() / 1000 : undefined,
        largeImageKey: values.largeImageKey === "None" ? undefined : values.largeImageKey,
        smallImageKey: values.smallImageKey === "None" ? undefined : values.smallImageKey,
        largeImageText: values.largeImageText,
        smallImageText: values.smallImageText,
        buttons: buttons.length > 0 ? buttons : undefined,
        stateUrl: values.stateUrl,
        detailsUrl: values.detailsUrl,
      });
      if (success) {
        showToast({
          style: Toast.Style.Success,
          title: "Yay!",
          message: `Discord presence set`,
        });
      } else {
        showToast({
          style: Toast.Style.Failure,
          title: "Error",
          message: `Something went wrong`,
        });
      }
    },
    validation: {
      state: (v) => validateRequired(v) || validateMinMax(v, 1, 128),
      details: (v) => validateRequired(v) || validateMinMax(v, 1, 128),
      startTimestamp: (v) => {
        if (v && values.endTimestamp) return "You can only select 'Start Timestamp' or 'End Timestamp'";
      },
      endTimestamp: (v) => {
        if (v && values.startTimestamp) return "You can only select 'Start Timestamp' or 'End Timestamp'";
      },
      button1Url: (v) => validateUrl(v) || validateMinMax(v, 1, 512) || (() => {
        if (v && !values.button1Label) return "Both fields must be filled";
      })(),
      button2Url: (v) => validateUrl(v) || validateMinMax(v, 1, 512) || (() => {
        if (v && !values.button2Label) return "Both fields must be filled";
      })(),
      button1Label: (v) => validateMinMax(v, 1, 32) || (() => {
        if (v && !values.button1Url) return "Both fields must be filled";
      })(),
      button2Label: (v) => validateMinMax(v, 1, 32) || (() => {
        if (v && !values.button2Url) return "Both fields must be filled";
      })(),
      largeImageText: (v) => validateMinMax(v, 1, 128),
      smallImageText: (v) => validateMinMax(v, 1, 128),
    },
  });

  const applicationId = getPreferenceValues().applicationId as string;
  useEffect(() => {
    const loadSettings = async () => {
      const settings = await LocalStorage.getItem("settings");
      if (!settings) {
        setIsLoading(false);
        return;
      }
      const parsedSettings = JSON.parse(settings as string);
      reset(parsedSettings);

      try {
        await init(applicationId);
        const keys = await getImageKeys();
        setImageKeys([
          "None",
          ...(keys ?? [])
        ]);
      } catch {
        setImageKeys([
          "None"
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    loadSettings();
  }, []);

  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    LocalStorage.setItem("settings", JSON.stringify(values));
  }, [values]);

  if (isLoading) {
    return null;
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Submit" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField title="State" placeholder="Working on index.ts" {...itemProps.state} />
      <Form.TextField title="Details" placeholder="Playing with Raycast" {...itemProps.details} />
      <Form.TextField title="State URL" placeholder="https://kdv.one/" {...itemProps.stateUrl} />
      <Form.TextField title="Details URL" placeholder="https://kdv.one/" {...itemProps.detailsUrl} />
      <Form.Dropdown title="Type" {...itemProps.type}>
        <Form.Dropdown.Item title="Playing" value="0" />
        <Form.Dropdown.Item title="Listening" value="2" />
        <Form.Dropdown.Item title="Watching" value="3" />
        <Form.Dropdown.Item title="Competing" value="5" />
      </Form.Dropdown>
      <Form.Dropdown title="Status Display Type" {...itemProps.displayType}>
        <Form.Dropdown.Item title="Name (e.g: Listening to Spotify)" value="0" />
        <Form.Dropdown.Item title="State (e.g: Listening to Rick Astley)" value="1" />
        <Form.Dropdown.Item title="Details (e.g: Listening to Never Gonna Give You Up)" value="2" />
      </Form.Dropdown>
      <Form.DatePicker title="Start Timestamp" {...itemProps.startTimestamp} />
      <Form.DatePicker title="End Timestamp" {...itemProps.endTimestamp} />
      <Form.Dropdown title="Large Image Key"  {...itemProps.largeImageKey} >
        {imageKeys?.map((key) => (
          <Form.Dropdown.Item key={key} title={key} value={key} />
        ))}
      </Form.Dropdown>
      <Form.Dropdown title="Small Image Key" {...itemProps.smallImageKey} >
        {imageKeys?.map((key) => (
          <Form.Dropdown.Item key={key} title={key} value={key} />
        ))}
      </Form.Dropdown>
      <Form.TextField title="Large Image Text" placeholder="Enter large image text" {...itemProps.largeImageText} />
      <Form.TextField title="Small Image Text" placeholder="Enter small image text" {...itemProps.smallImageText} />
      <Form.TextField title="Button 1 Label" placeholder="Enter button 1 label" {...itemProps.button1Label} />
      <Form.TextField title="Button 1 URL" placeholder="Enter button 1 URL" {...itemProps.button1Url} />
      <Form.TextField title="Button 2 Label" placeholder="Enter button 2 label" {...itemProps.button2Label} />
      <Form.TextField title="Button 2 URL" placeholder="Enter button 2 URL" {...itemProps.button2Url} />
    </Form>
  );
}