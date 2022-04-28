import { FieldType, MutableDataFrame } from '@grafana/data';
import { ProjectMetrics } from 'metrics/types';
import { DataFrameSet } from 'metrics/types/DataFrameSet';

export function createFrameSetsFromProjectMetrics(data: ProjectMetrics, refId: string) {
  const dataFrameSets: DataFrameSet[] = [];

  Object.keys(data.measurements).forEach((measurementsKey: string) => {
    const plugins = data.measurements[measurementsKey].plugins;
    Object.keys(plugins).forEach((pluginsKey: string) => {
      const metrics = plugins[pluginsKey].metrics;
      Object.keys(metrics).forEach((metricsKey: string) => {
        metrics[metricsKey].forEach((metric) => {
          const frameSet = dataFrameSets.find((dfs) => dfs.plugin === pluginsKey && dfs.metric === metricsKey);
          if (frameSet) {
            frameSet.frame.add({
              time: Date.parse(metric.time),
              value: metric.value,
            });
          } else {
            const frame = new MutableDataFrame({
              refId: refId,
              name: `${pluginsKey}.${metricsKey}`,
              fields: [
                { name: 'time', type: FieldType.time },
                { name: 'value', type: FieldType.number },
              ],
            });
            frame.add({
              time: Date.parse(metric.time),
              value: metric.value,
            });
            dataFrameSets.push({
              plugin: pluginsKey,
              metric: metricsKey,
              frame,
            });
          }
        });
      });
    });
  });

  return dataFrameSets;
}
