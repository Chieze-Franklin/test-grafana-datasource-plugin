import React, { ChangeEvent, PureComponent } from 'react';
// import { LegacyForms, Select } from '@grafana/ui';
import { DataSourcePluginOptionsEditorProps, SelectableValue } from '@grafana/data';
import { MetricType, MyDataSourceOptions } from './types';

// const { FormField } = LegacyForms;

interface Props extends DataSourcePluginOptionsEditorProps<MyDataSourceOptions> {}

interface State {
  // metricOwnerType: MetricOwnerType;
}

export class ConfigEditor extends PureComponent<Props, State> {
  metricOwnerTypeOptions: Array<SelectableValue<MetricType>> = [
    { label: 'Default', value: undefined, description: 'get metrics from a default owner' },
    { label: 'Agent', value: 'agent', description: 'get metrics from an agent' },
    { label: 'Aggregator', value: 'aggregator', description: 'get metrics from an aggregator' },
    { label: 'Pipeline', value: 'pipeline', description: 'get metrics from an pipeline' },
    { label: 'Project', value: 'project', description: 'get metrics from an project' },
  ];

  onMetricOwnerIdChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onOptionsChange, options } = this.props;
    const jsonData = {
      ...options.jsonData,
      metricOwnerId: event.target.value,
    };
    onOptionsChange({ ...options, jsonData });
  };

  onMetricOwnerTypeChange = (value: SelectableValue<MetricType>) => {
    const { onOptionsChange, options } = this.props;
    const jsonData = {
      ...options.jsonData,
      metricOwnerType: value.value || 'project',
    };
    onOptionsChange({ ...options, jsonData });
  };

  // Secure field (only sent to the backend)
  onAccessTokenChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onOptionsChange, options } = this.props;
    onOptionsChange({
      ...options,
      secureJsonData: {
        accessToken: event.target.value,
      },
    });
  };

  onResetAccessToken = () => {
    const { onOptionsChange, options } = this.props;
    onOptionsChange({
      ...options,
      secureJsonFields: {
        ...options.secureJsonFields,
        accessToken: false,
      },
      secureJsonData: {
        ...options.secureJsonData,
        accessToken: '',
      },
    });
  };

  render() {
    // const { options } = this.props;
    // const { jsonData /*secureJsonFields*/ } = options;
    // const secureJsonData = (options.secureJsonData || {}) as MySecureJsonData;

    return (
      <div className="gf-form-group">
        {/* <div className="gf-form">
          <Select
            options={this.metricOwnerTypeOptions}
            value={jsonData.metricOwnerType || ''}
            onChange={this.onMetricOwnerTypeChange}
            placeholder="the id of the resource that owns the metrics"
          />
        </div>

        <div className="gf-form">
          <FormField
            label="Metric Owner ID"
            labelWidth={6}
            inputWidth={20}
            onChange={this.onMetricOwnerIdChange}
            value={jsonData.metricOwnerId || ''}
            placeholder="the id of the resource that owns the metrics"
          />
        </div>

        <div className="gf-form-inline">
          <div className="gf-form">
            <SecretFormField
              isConfigured={(secureJsonFields && secureJsonFields.accessToken) as boolean}
              value={secureJsonData.accessToken || ''}
              label="Access Token"
              placeholder="secure json field (backend only)"
              labelWidth={6}
              inputWidth={20}
              onReset={this.onResetAccessToken}
              onChange={this.onAccessTokenChange}
            />
          </div>
        </div> */}
      </div>
    );
  }
}
