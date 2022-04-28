import { MutableDataFrame } from '@grafana/data';

export type DataFrameSet = {
  plugin: string;
  metric: string;
  frame: MutableDataFrame<any>;
};
