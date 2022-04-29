import defaults from 'lodash/defaults';

import React, { PureComponent } from 'react';
import { Icon, LegacyForms, SegmentAsync, SegmentSection } from '@grafana/ui';
import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { DataSource } from './datasource';
import { defaultQuery, MetricType, MyDataSourceOptions, MyQuery } from './types';
import { fetchApiData, getProxyUrl, getQueryDuration, makePhrase } from 'utils';
import { createFrameSetsFromProjectMetrics } from 'metrics/utils/project-metrics';
import { DataFrameSet } from 'metrics/types/DataFrameSet';

const {
  /* FormField*/
} = LegacyForms;

type Props = QueryEditorProps<DataSource, MyQuery, MyDataSourceOptions>;

export class QueryEditor extends PureComponent<Props> {
  frameSets: DataFrameSet[] = [];

  metricTypeOptions: Array<SelectableValue<MetricType>> = [
    { label: 'Agent', value: 'agent', description: 'get metrics from an agent' },
    { label: 'Aggregator', value: 'aggregator', description: 'get metrics from an aggregator' },
    { label: 'Pipeline', value: 'pipeline', description: 'get metrics from an pipeline' },
    { label: 'Project', value: 'project', description: 'get metrics from an project' },
  ];

  metricsOptions: Array<SelectableValue<string>> = [];

  projectOptions: Array<SelectableValue<string>> = [];

  pluginsOptions: Array<SelectableValue<string>> = [];

  loadMetricTypeOptions = (): Promise<Array<SelectableValue<MetricType>>> =>
    new Promise((res) => res(this.metricTypeOptions));

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

  loadProjectPluginOptions = (project: string, query: { refId: string }): Promise<Array<SelectableValue<string>>> => {
    const { refId } = query;
    return new Promise((res) => {
      if (this.pluginsOptions && this.pluginsOptions.length) {
        return res(this.pluginsOptions);
      }

      return fetchApiData(
        `${getProxyUrl()}/calyptia/v1/projects/${project}/metrics?start=-${getQueryDuration()}h&interval=1h`
      )
        .then((response) => {
          // @ts-ignore
          const data: ProjectMetrics = response.data;
          const frameSets = createFrameSetsFromProjectMetrics(data, refId);

          this.frameSets = frameSets;
          return res(
            frameSets
              .filter((fs, index) => index === 0 || fs.plugin !== frameSets[index - 1].plugin)
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

  onMetricTypeChange = (value: SelectableValue<MetricType>) => {
    const { onChange, query } = this.props;
    onChange({ ...query, metricType: value.value, project: undefined });
    this.projectOptions = [];
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
    const { metricType, metric, project, plugin } = query;
    const { refId } = query;

    const AddButton = (
      <a className="gf-form-label query-part">
        <Icon name="plus" />
      </a>
    );

    const CustomLabelComponent = ({ value }: any) => <div className="gf-form-label">{value}</div>;

    return (
      <div className="gf-form-group">
        <div className="gf-form">
          {/* <FormField
            labelWidth={8}
            value={projectId || ''}
            onChange={this.onProjectIdChange}
            label="Project ID"
            tooltip="Enter the project ID"
          /> */}
          <SegmentSection label="Series">
            <SegmentAsync
              Component={
                metricType ? (
                  <CustomLabelComponent
                    value={this.metricTypeOptions.find((type) => type.value === metricType)?.label}
                  />
                ) : (
                  AddButton
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
                    AddButton
                  )
                }
                value={project}
                loadOptions={() => this.loadProjectOptions()}
                onChange={this.onProjectChange}
                inputMinWidth={300}
              />
            )}
            {metricType === 'project' && project && (
              <SegmentAsync
                Component={
                  plugin ? (
                    <CustomLabelComponent value={this.pluginsOptions.find((plug) => plug.value === plugin)?.label} />
                  ) : (
                    AddButton
                  )
                }
                value={plugin}
                loadOptions={() => this.loadProjectPluginOptions(project, { refId })}
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
                    AddButton
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
