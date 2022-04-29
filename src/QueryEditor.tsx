import defaults from 'lodash/defaults';

import React, { PureComponent } from 'react';
import { Icon, SegmentAsync, SegmentSection } from '@grafana/ui';
import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { DataSource } from './datasource';
import { defaultQuery, MetricType, MyDataSourceOptions, MyQuery } from './types';
import { fetchApiData, getProxyUrl, getQueryDuration, makePhrase, setQueryDuration } from 'utils';
import { createFrameSetsFromAgentOrProjectMetrics } from 'metrics/utils/project-metrics';
import { DataFrameSet } from 'metrics/types/DataFrameSet';
import { AggregatorMetrics } from 'metrics/types/AggregatorMetrics';
import { createFrameSetsFromAggregatorMetrics } from 'metrics/utils/aggregator-metrics';
import { AgentMetrics } from 'metrics/types/AgentMetrics';

type Props = QueryEditorProps<DataSource, MyQuery, MyDataSourceOptions>;

export class QueryEditor extends PureComponent<Props> {
  frameSets: DataFrameSet[] = [];

  metricTypeOptions: Array<SelectableValue<MetricType>> = [
    { label: 'Agent', value: 'agent', description: 'get metrics from an agent' },
    { label: 'Aggregator', value: 'aggregator', description: 'get metrics from an aggregator' },
    { label: 'Pipeline', value: 'pipeline', description: 'get metrics from a pipeline' },
    { label: 'Project', value: 'project', description: 'get metrics from a project' },
  ];

  agentOptions: Array<SelectableValue<string>> = [];

  aggregatorOptions: Array<SelectableValue<string>> = [];

  metricsOptions: Array<SelectableValue<string>> = [];

  projectOptions: Array<SelectableValue<string>> = [];

  pluginsOptions: Array<SelectableValue<string>> = [];

  loadMetricTypeOptions = (): Promise<Array<SelectableValue<MetricType>>> =>
    new Promise((res) => res(this.metricTypeOptions));

  loadAgentOptions = (project: string): Promise<Array<SelectableValue<string>>> => {
    return new Promise((res) => {
      return fetchApiData(`${getProxyUrl()}/calyptia/v1/projects/${project}/agents`)
        .then((response) =>
          res(
            // @ts-ignore
            response.data
              // @ts-ignore
              .map((item) => {
                this.agentOptions.push({
                  label: `${item.name} ${item.version}`,
                  value: item.id,
                });
                return {
                  label: `${item.name} ${item.version}`,
                  value: item.id,
                };
              })
          )
        )
        .catch((e) => {
          console.log('>>>>>>>>>>>>>>>>>>>>>>error in loadAgentOptions');
          console.log(e);
        });
    });
  };

  loadAggregatorOptions = (project: string): Promise<Array<SelectableValue<string>>> => {
    return new Promise((res) => {
      return fetchApiData(`${getProxyUrl()}/calyptia/v1/projects/${project}/aggregators`)
        .then((response) =>
          res(
            // @ts-ignore
            response.data
              // @ts-ignore
              .map((item) => {
                this.aggregatorOptions.push({
                  label: `${item.name} ${item.version}`,
                  value: item.id,
                });
                return {
                  label: `${item.name} ${item.version}`,
                  value: item.id,
                };
              })
          )
        )
        .catch((e) => {
          console.log('>>>>>>>>>>>>>>>>>>>>>>error in loadAggregatorOptions');
          console.log(e);
        });
    });
  };

  loadPluginOptions = (
    ownerId: string,
    metricType: MetricType,
    query: { refId: string; refresh?: boolean }
  ): Promise<Array<SelectableValue<string>>> => {
    const { refId, refresh } = query;
    return new Promise((res) => {
      if (!refresh && this.pluginsOptions && this.pluginsOptions.length) {
        return res(this.pluginsOptions);
      }

      let url = '';
      if (metricType === 'agent') {
        url = `${getProxyUrl()}/calyptia/v1/agents/${ownerId}/metrics?start=-${getQueryDuration()}h&interval=1h`;
      } else if (metricType === 'aggregator') {
        url = `${getProxyUrl()}/calyptia/v1/aggregator_metrics/${ownerId}?start=-${getQueryDuration()}h&interval=1h`;
      } else if (metricType === 'project') {
        url = `${getProxyUrl()}/calyptia/v1/projects/${ownerId}/metrics?start=-${getQueryDuration()}h&interval=1h`;
      }

      return fetchApiData(url)
        .then((response) => {
          if (metricType === 'agent') {
            // @ts-ignore
            const data: AgentMetrics = response.data;
            const frameSets = createFrameSetsFromAgentOrProjectMetrics(data, refId);
            this.frameSets = frameSets;
          } else if (metricType === 'aggregator') {
            // @ts-ignore
            const data: AggregatorMetrics = response.data;
            const frameSets = createFrameSetsFromAggregatorMetrics(data, refId);
            this.frameSets = frameSets;
          } else if (metricType === 'project') {
            // @ts-ignore
            const data: ProjectMetrics = response.data;
            const frameSets = createFrameSetsFromAgentOrProjectMetrics(data, refId);
            this.frameSets = frameSets;
          }

          return res(
            this.frameSets
              .filter((fs, index) => index === 0 || fs.plugin !== this.frameSets[index - 1].plugin)
              .map((fs) => {
                this.pluginsOptions.push({
                  label: makePhrase(fs.plugin),
                  value: fs.plugin,
                });
                return {
                  label: makePhrase(fs.plugin),
                  value: fs.plugin,
                };
              })
          );
        })
        .catch((e) => {
          console.log('>>>>>>>>>>>>>>>>>>>>>>error in loadProjectPluginOptions');
          console.log(e);
        });
    });
  };

  loadMetricOptions = (plugin: string): Promise<Array<SelectableValue<string>>> =>
    new Promise((res) => {
      return res(
        this.frameSets
          .filter((fs) => fs.plugin === plugin)
          .map((fs) => {
            this.metricsOptions.push({
              label: makePhrase(fs.metric),
              value: fs.metric,
            });
            return {
              label: makePhrase(fs.metric),
              value: fs.metric,
            };
          })
      );
    });

  loadProjectOptions = (): Promise<Array<SelectableValue<string>>> => {
    return new Promise((res) => {
      return fetchApiData(`${getProxyUrl()}/calyptia/v1/projects`)
        .then((response) =>
          res(
            // @ts-ignore
            response.data
              // @ts-ignore
              .map((item) => {
                this.projectOptions.push({
                  label: `${item.name} (${item.id})`,
                  value: item.id,
                });
                return {
                  label: `${item.name} (${item.id})`,
                  value: item.id,
                };
              })
          )
        )
        .catch((e) => {
          console.log('>>>>>>>>>>>>>>>>>>>>>>error in loadProjectOptions');
          console.log(e);
        });
    });
  };

  onMetricTypeChange = (value: SelectableValue<MetricType>) => {
    const { onChange, query } = this.props;
    onChange({ ...query, metricType: value.value, project: undefined });
    this.projectOptions = [];
  };

  onAgentChange = (value: SelectableValue<string>) => {
    const { onChange, query } = this.props;
    onChange({ ...query, agent: value.value, plugin: undefined, metric: undefined });
    this.pluginsOptions = [];
  };

  onAggregatorChange = (value: SelectableValue<string>) => {
    const { onChange, query } = this.props;
    onChange({ ...query, aggregator: value.value, plugin: undefined, metric: undefined });
    this.pluginsOptions = [];
  };

  onMetricChange = (value: SelectableValue<string>) => {
    const { onChange, onRunQuery, query } = this.props;
    onChange({
      ...query,
      metric: value.value,
      frame: this.frameSets.find((fs) => fs.plugin === query.plugin && fs.metric === value.value)?.frame,
    });
    onRunQuery();
  };

  onProjectChange = (value: SelectableValue<string>) => {
    const { onChange, query } = this.props;
    onChange({
      ...query,
      project: value.value,
      agent: undefined,
      aggregator: undefined,
      pipeline: undefined,
      plugin: undefined,
      metric: undefined,
    });
    this.agentOptions = [];
    this.aggregatorOptions = [];
    this.pluginsOptions = [];
  };

  onPluginChange = (value: SelectableValue<string>) => {
    const { onChange, query } = this.props;
    onChange({ ...query, plugin: value.value, metric: undefined });
    this.metricsOptions = [];
  };

  // onProjectIdChange = (event: ChangeEvent<HTMLInputElement>) => {
  //   const { onChange, query } = this.props;
  //   onChange({ ...query, projectId: event.target.value });
  // };

  render() {
    const query = defaults(this.props.query, defaultQuery);
    const { metricType, agent, aggregator, metric, project, plugin } = query;
    const { refId } = query;

    const { range } = this.props;
    const from = range!.from.valueOf();
    const to = range!.to.valueOf();
    // duration of the time range, in milliseconds.
    let duration = to - from;
    // convert duration to hour
    duration = duration / (1000 * 60 * 60);
    duration = Math.ceil(duration);
    if (getQueryDuration() !== duration) {
      if (metricType === 'agent' && agent) {
        this.loadPluginOptions(agent, 'agent', { refId, refresh: true });
      } else if (metricType === 'aggregator' && aggregator) {
        this.loadPluginOptions(aggregator, 'aggregator', { refId, refresh: true });
      } else if (metricType === 'project' && project) {
        this.loadPluginOptions(project, 'project', { refId, refresh: true });
      }
    }
    setQueryDuration(duration);

    const AddButton = ({ label }: { label: string }) => (
      <a className="gf-form-label query-part">
        <Icon name="plus" /> {label}
      </a>
    );

    const CustomLabelComponent = ({ value }: any) => <div className="gf-form-label">{value}</div>;

    return (
      <div className="gf-form-group">
        <div className="gf-form">
          <SegmentSection label="Series">
            <SegmentAsync
              Component={
                metricType ? (
                  <CustomLabelComponent
                    value={this.metricTypeOptions.find((type) => type.value === metricType)?.label}
                  />
                ) : (
                  <AddButton label="Metric Type" />
                )
              }
              value={metricType}
              loadOptions={() => this.loadMetricTypeOptions()}
              onChange={this.onMetricTypeChange}
              inputMinWidth={300}
            />
            {metricType && (
              <SegmentAsync
                Component={
                  project ? (
                    <CustomLabelComponent value={this.projectOptions.find((id) => id.value === project)?.label} />
                  ) : (
                    <AddButton label="Project" />
                  )
                }
                value={project}
                loadOptions={() => this.loadProjectOptions()}
                onChange={this.onProjectChange}
                inputMinWidth={300}
              />
            )}

            {metricType === 'agent' && project && (
              <SegmentAsync
                Component={
                  agent ? (
                    <CustomLabelComponent value={this.agentOptions.find((ag) => ag.value === agent)?.label} />
                  ) : (
                    <AddButton label="Agent" />
                  )
                }
                value={agent}
                loadOptions={() => this.loadAgentOptions(project)}
                onChange={this.onAgentChange}
                inputMinWidth={300}
              />
            )}
            {metricType === 'agent' && project && agent && (
              <SegmentAsync
                Component={
                  plugin ? (
                    <CustomLabelComponent value={this.pluginsOptions.find((plug) => plug.value === plugin)?.label} />
                  ) : (
                    <AddButton label="Plugin" />
                  )
                }
                value={plugin}
                loadOptions={() => this.loadPluginOptions(agent, 'agent', { refId })}
                onChange={this.onPluginChange}
                inputMinWidth={300}
              />
            )}

            {metricType === 'aggregator' && project && (
              <SegmentAsync
                Component={
                  aggregator ? (
                    <CustomLabelComponent
                      value={this.aggregatorOptions.find((agg) => agg.value === aggregator)?.label}
                    />
                  ) : (
                    <AddButton label="Aggregator" />
                  )
                }
                value={aggregator}
                loadOptions={() => this.loadAggregatorOptions(project)}
                onChange={this.onAggregatorChange}
                inputMinWidth={300}
              />
            )}
            {metricType === 'aggregator' && project && aggregator && (
              <SegmentAsync
                Component={
                  plugin ? (
                    <CustomLabelComponent value={this.pluginsOptions.find((plug) => plug.value === plugin)?.label} />
                  ) : (
                    <AddButton label="Plugin" />
                  )
                }
                value={plugin}
                loadOptions={() => this.loadPluginOptions(aggregator, 'aggregator', { refId })}
                onChange={this.onPluginChange}
                inputMinWidth={300}
              />
            )}

            {metricType === 'project' && project && (
              <SegmentAsync
                Component={
                  plugin ? (
                    <CustomLabelComponent value={this.pluginsOptions.find((plug) => plug.value === plugin)?.label} />
                  ) : (
                    <AddButton label="Plugin" />
                  )
                }
                value={plugin}
                loadOptions={() => this.loadPluginOptions(project, 'project', { refId })}
                onChange={this.onPluginChange}
                inputMinWidth={300}
              />
            )}

            {plugin && (
              <SegmentAsync
                Component={
                  metric ? (
                    <CustomLabelComponent value={this.metricsOptions.find((mtrc) => mtrc.value === metric)?.label} />
                  ) : (
                    <AddButton label="Metric" />
                  )
                }
                value={metric}
                loadOptions={() => this.loadMetricOptions(plugin)}
                onChange={this.onMetricChange}
                inputMinWidth={300}
              />
            )}
          </SegmentSection>
        </div>
      </div>
    );
  }
}
