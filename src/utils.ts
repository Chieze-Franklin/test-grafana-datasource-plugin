import { getBackendSrv } from '@grafana/runtime';

let proxyUrl: string | undefined = '';
let queryDuration = 24 * 7;

export async function fetchApiData(url: string) {
  const result = await getBackendSrv()
    .datasourceRequest({
      method: 'GET',
      url,
    })
    .catch((e) => {
      console.log('>>>>>>>>>>>>>>>>>>>>>>error in dorequest');
      console.log(e);
    });
  return result;
}

export function getProxyUrl() {
  return proxyUrl;
}
export function setProxyUrl(url?: string) {
  proxyUrl = url;
}

export function getQueryDuration() {
  return queryDuration;
}
export function setQueryDuration(value: number) {
  queryDuration = value;
}

export function makePhrase(word: string) {
  return word.replace(/_/g, ' ').replace(/\./g, ' ');
}
