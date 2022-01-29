import { MACDResult } from '../common/macdUtils'
import { mapOutputToConfindence } from './stochastic'
import { Stochastic } from 'technicalindicators'
import { StochasticInput } from 'technicalindicators/declarations/momentum/Stochastic'
import { tail, takeRight } from 'lodash'
import { OHLCBlock } from 'src/common/interfaces/interfaces'
import * as ta from 'ta.js'

describe('Stochastic Fast', () => {

  let blocks: OHLCBlock[]
  let input: StochasticInput

  beforeEach(() => {

    blocks = [
      {
        time: 1640750400,
        open: 1.423297,
        high: 1.435456,
        low: 1.399077,
        close: 1.399077,
        volume: 202685.23254335
      },
      {
        time: 1640764800,
        open: 1.411091,
        high: 1.418541,
        low: 1.392701,
        close: 1.409489,
        volume: 32433.00786508
      },
      {
        time: 1640779200,
        open: 1.405144,
        high: 1.405144,
        low: 1.332589,
        close: 1.399368,
        volume: 389221.39226819
      },
      {
        time: 1640793600,
        open: 1.397565,
        high: 1.39833,
        low: 1.356307,
        close: 1.359767,
        volume: 210859.27641719
      },
      {
        time: 1640808000,
        open: 1.360079,
        high: 1.375424,
        low: 1.325,
        close: 1.329337,
        volume: 259285.09812776
      },
      {
        time: 1640822400,
        open: 1.332046,
        high: 1.332524,
        low: 1.296005,
        close: 1.309131,
        volume: 318970.31849872
      },
      {
        time: 1640836800,
        open: 1.304904,
        high: 1.347038,
        low: 1.304904,
        close: 1.342704,
        volume: 89307.09044416
      },
      {
        time: 1640851200,
        open: 1.347192,
        high: 1.362731,
        low: 1.324996,
        close: 1.362731,
        volume: 104301.93984795
      },
      {
        time: 1640865600,
        open: 1.357822,
        high: 1.378554,
        low: 1.342072,
        close: 1.350997,
        volume: 167766.73244598
      },
      {
        time: 1640880000,
        open: 1.350885,
        high: 1.369561,
        low: 1.347891,
        close: 1.357713,
        volume: 139680.53320666
      },
      {
        time: 1640894400,
        open: 1.357215,
        high: 1.363336,
        low: 1.332087,
        close: 1.357707,
        volume: 78660.90789943
      },
      {
        time: 1640908800,
        open: 1.357871,
        high: 1.36617,
        low: 1.337093,
        close: 1.341021,
        volume: 68878.96824038
      },
      {
        time: 1640923200,
        open: 1.345316,
        high: 1.350297,
        low: 1.3063,
        close: 1.328405,
        volume: 265521.56305053
      },
      {
        time: 1640937600,
        open: 1.328539,
        high: 1.381088,
        low: 1.32806,
        close: 1.363137,
        volume: 198628.37794672
      },
      {
        time: 1640952000,
        open: 1.359085,
        high: 1.367522,
        low: 1.349583,
        close: 1.352558,
        volume: 74226.53599986
      },
      {
        time: 1640966400,
        open: 1.352703,
        high: 1.352703,
        low: 1.281496,
        close: 1.283953,
        volume: 616255.22588246
      },
      {
        time: 1640980800,
        open: 1.292259,
        high: 1.318714,
        low: 1.290547,
        close: 1.309469,
        volume: 580178.27610228
      },
      {
        time: 1640995200,
        open: 1.31239,
        high: 1.337816,
        low: 1.31239,
        close: 1.32421,
        volume: 458972.75272811
      },
      {
        time: 1641009600,
        open: 1.32419,
        high: 1.336481,
        low: 1.305832,
        close: 1.323208,
        volume: 85959.11442235
      },
      {
        time: 1641024000,
        open: 1.323398,
        high: 1.331544,
        low: 1.311263,
        close: 1.322914,
        volume: 39002.90881445
      },
      {
        time: 1641038400,
        open: 1.319297,
        high: 1.337867,
        low: 1.319297,
        close: 1.333278,
        volume: 21249.8770491
      },
      {
        time: 1641052800,
        open: 1.332929,
        high: 1.348218,
        low: 1.332813,
        close: 1.346421,
        volume: 91540.69269348
      },
      {
        time: 1641067200,
        open: 1.34721,
        high: 1.378188,
        low: 1.346327,
        close: 1.378188,
        volume: 128068.63276318
      },
      {
        time: 1641081600,
        open: 1.378335,
        high: 1.381088,
        low: 1.351539,
        close: 1.354929,
        volume: 52314.26950885
      },
      {
        time: 1641096000,
        open: 1.356708,
        high: 1.368846,
        low: 1.34378,
        close: 1.355095,
        volume: 21741.49240333
      },
      {
        time: 1641110400,
        open: 1.351937,
        high: 1.367752,
        low: 1.349583,
        close: 1.363511,
        volume: 30753.17061932
      },
      {
        time: 1641124800,
        open: 1.362549,
        high: 1.373334,
        low: 1.356307,
        close: 1.36961,
        volume: 21966.43048315
      },
      {
        time: 1641139200,
        open: 1.371952,
        high: 1.389363,
        low: 1.355059,
        close: 1.363065,
        volume: 144183.32778724
      },
      {
        time: 1641153600,
        open: 1.360973,
        high: 1.378507,
        low: 1.358867,
        close: 1.378019,
        volume: 64558.08644919
      },
      {
        time: 1641168000,
        open: 1.372408,
        high: 1.372443,
        low: 1.346681,
        close: 1.349268,
        volume: 36281.68171467
      },
      {
        time: 1641182400,
        open: 1.351045,
        high: 1.359096,
        low: 1.345437,
        close: 1.351552,
        volume: 43241.90627755
      },
      {
        time: 1641196800,
        open: 1.353333,
        high: 1.372177,
        low: 1.348975,
        close: 1.370283,
        volume: 44884.65634121
      },
      {
        time: 1641211200,
        open: 1.370914,
        high: 1.372481,
        low: 1.351539,
        close: 1.353138,
        volume: 49657.33310839
      },
      {
        time: 1641225600,
        open: 1.351,
        high: 1.351,
        low: 1.326273,
        close: 1.330861,
        volume: 97124.11118894
      },
      {
        time: 1641240000,
        open: 1.32961,
        high: 1.331123,
        low: 1.311263,
        close: 1.317407,
        volume: 155285.51291897
      },
      {
        time: 1641254400,
        open: 1.321836,
        high: 1.321836,
        low: 1.29641,
        close: 1.314422,
        volume: 321913.96829536
      },
      {
        time: 1641268800,
        open: 1.314722,
        high: 1.323492,
        low: 1.307524,
        close: 1.323492,
        volume: 52117.91046558
      },
      {
        time: 1641283200,
        open: 1.323877,
        high: 1.34,
        low: 1.319683,
        close: 1.34,
        volume: 119227.82857537
      },
      {
        time: 1641297600,
        open: 1.34,
        high: 1.349998,
        low: 1.328741,
        close: 1.335206,
        volume: 51004.3596418
      },
      {
        time: 1641312000,
        open: 1.334936,
        high: 1.348867,
        low: 1.302546,
        close: 1.312684,
        volume: 186124.43595015
      },
      {
        time: 1641326400,
        open: 1.321873,
        high: 1.326211,
        low: 1.308569,
        close: 1.310902,
        volume: 47965.0971315
      },
      {
        time: 1641340800,
        open: 1.308397,
        high: 1.333268,
        low: 1.304601,
        close: 1.329592,
        volume: 28724.30796144
      },
      {
        time: 1641355200,
        open: 1.331579,
        high: 1.350297,
        low: 1.329929,
        close: 1.339697,
        volume: 80109.38309893
      },
      {
        time: 1641369600,
        open: 1.337955,
        high: 1.351444,
        low: 1.324462,
        close: 1.324462,
        volume: 33569.00238254
      },
      {
        time: 1641384000,
        open: 1.326705,
        high: 1.336952,
        low: 1.317677,
        close: 1.327429,
        volume: 122923.17632784
      },
      {
        time: 1641398400,
        open: 1.327046,
        high: 1.327046,
        low: 1.24561,
        close: 1.255916,
        volume: 590618.96780471
      },
      {
        time: 1641412800,
        open: 1.254728,
        high: 1.265426,
        low: 1.193608,
        close: 1.228816,
        volume: 770638.38728023
      },
      {
        time: 1641427200,
        open: 1.229725,
        high: 1.242955,
        low: 1.204546,
        close: 1.204546,
        volume: 194721.9072438
      },
      {
        time: 1641441600,
        open: 1.210105,
        high: 1.231491,
        low: 1.197648,
        close: 1.222143,
        volume: 249356.44667204
      },
      {
        time: 1641456000,
        open: 1.222474,
        high: 1.222621,
        low: 1.193472,
        close: 1.203818,
        volume: 243922.46915256
      },
      {
        time: 1641470400,
        open: 1.207023,
        high: 1.246993,
        low: 1.186256,
        close: 1.230997,
        volume: 247887.07710329
      },
      {
        time: 1641484800,
        open: 1.232846,
        high: 1.253226,
        low: 1.22672,
        close: 1.248669,
        volume: 297543.27754792
      },
      {
        time: 1641499200,
        open: 1.250412,
        high: 1.295764,
        low: 1.249427,
        close: 1.275389,
        volume: 87067.17973105
      },
      {
        time: 1641513600,
        open: 1.281547,
        high: 1.281547,
        low: 1.202197,
        close: 1.2075,
        volume: 316514.83890328
      },
      {
        time: 1641528000,
        open: 1.20714,
        high: 1.238045,
        low: 1.191253,
        close: 1.207294,
        volume: 476797.72252612
      },
      {
        time: 1641542400,
        open: 1.208352,
        high: 1.244213,
        low: 1.204403,
        close: 1.233536,
        volume: 251757.35163619
      },
      {
        time: 1641556800,
        open: 1.236542,
        high: 1.248871,
        low: 1.10034,
        close: 1.212774,
        volume: 1912142.27215386
      },
      {
        time: 1641571200,
        open: 1.212203,
        high: 1.238764,
        low: 1.196215,
        close: 1.224932,
        volume: 332848.67038306
      },
      {
        time: 1641585600,
        open: 1.227364,
        high: 1.229836,
        low: 1.202196,
        close: 1.207556,
        volume: 51069.56612576
      },
      {
        time: 1641600000,
        open: 1.212774,
        high: 1.23205,
        low: 1.209852,
        close: 1.2258,
        volume: 120090.40082422
      },
      {
        time: 1641614400,
        open: 1.226414,
        high: 1.2411,
        low: 1.218892,
        close: 1.238102,
        volume: 103481.40675568
      },
      {
        time: 1641628800,
        open: 1.241229,
        high: 1.254813,
        low: 1.234867,
        close: 1.237149,
        volume: 265987.41538179
      },
      {
        time: 1641643200,
        open: 1.24,
        high: 1.243148,
        low: 1.21136,
        close: 1.21484,
        volume: 100257.58200376
      },
      {
        time: 1641657600,
        open: 1.215019,
        high: 1.223678,
        low: 1.126725,
        close: 1.142554,
        volume: 877982.27167827
      },
      {
        time: 1641672000,
        open: 1.143213,
        high: 1.229388,
        low: 1.136005,
        close: 1.181267,
        volume: 586394.52784767
      },
      {
        time: 1641686400,
        open: 1.180755,
        high: 1.197306,
        low: 1.172988,
        close: 1.174114,
        volume: 254181.24677382
      },
      {
        time: 1641700800,
        open: 1.17726,
        high: 1.192262,
        low: 1.172021,
        close: 1.18022,
        volume: 461184.23433724
      },
      {
        time: 1641715200,
        open: 1.177444,
        high: 1.181723,
        low: 1.152753,
        close: 1.160908,
        volume: 155591.59736367
      },
      {
        time: 1641729600,
        open: 1.159905,
        high: 1.169024,
        low: 1.147974,
        close: 1.162087,
        volume: 77980.29966378
      },
      {
        time: 1641744000,
        open: 1.161209,
        high: 1.205697,
        low: 1.158971,
        close: 1.202568,
        volume: 351828.69204077
      },
      {
        time: 1641758400,
        open: 1.205072,
        high: 1.205918,
        low: 1.168439,
        close: 1.16908,
        volume: 258768.88625529
      },
      {
        time: 1641772800,
        open: 1.173405,
        high: 1.179625,
        low: 1.15634,
        close: 1.160319,
        volume: 95820.06922322
      },
      {
        time: 1641787200,
        open: 1.165296,
        high: 1.179408,
        low: 1.165296,
        close: 1.175674,
        volume: 253830.39860124
      },
      {
        time: 1641801600,
        open: 1.17109,
        high: 1.176322,
        low: 1.14837,
        close: 1.150634,
        volume: 69861.49147942
      },
      {
        time: 1641816000,
        open: 1.151677,
        high: 1.153565,
        low: 1.07191,
        close: 1.111935,
        volume: 1214557.4585456
      },
      {
        time: 1641830400,
        open: 1.113805,
        high: 1.137052,
        low: 1.092419,
        close: 1.112884,
        volume: 468691.96353857
      },
      {
        time: 1641844800,
        open: 1.116572,
        high: 1.142309,
        low: 1.108115,
        close: 1.124325,
        volume: 120061.78822956
      },
      {
        time: 1641859200,
        open: 1.124523,
        high: 1.166925,
        low: 1.122894,
        close: 1.159231,
        volume: 82234.33613182
      },
      {
        time: 1641873600,
        open: 1.163435,
        high: 1.163435,
        low: 1.147652,
        close: 1.154822,
        volume: 71709.3701648
      },
      {
        time: 1641888000,
        open: 1.157121,
        high: 1.166351,
        low: 1.134578,
        close: 1.144702,
        volume: 204133.9355956
      },
      {
        time: 1641902400,
        open: 1.141558,
        high: 1.160586,
        low: 1.136609,
        close: 1.159722,
        volume: 61121.58789625
      },
      {
        time: 1641916800,
        open: 1.158794,
        high: 1.194497,
        low: 1.158794,
        close: 1.18706,
        volume: 447494.90708584
      },
      {
        time: 1641931200,
        open: 1.189029,
        high: 1.193994,
        low: 1.175722,
        close: 1.18681,
        volume: 120451.91978824
      },
      {
        time: 1641945600,
        open: 1.18701,
        high: 1.220462,
        low: 1.18701,
        close: 1.220462,
        volume: 259554.31108593
      },
      {
        time: 1641960000,
        open: 1.21891,
        high: 1.21891,
        low: 1.199955,
        close: 1.200607,
        volume: 113894.79667393
      },
      {
        time: 1641974400,
        open: 1.202565,
        high: 1.255337,
        low: 1.202565,
        close: 1.244981,
        volume: 240679.43670289
      },
      {
        time: 1641988800,
        open: 1.245986,
        high: 1.28167,
        low: 1.245356,
        close: 1.277485,
        volume: 165153.15369859
      },
      {
        time: 1642003200,
        open: 1.277961,
        high: 1.294737,
        low: 1.27,
        close: 1.287252,
        volume: 417248.6029842
      },
      {
        time: 1642017600,
        open: 1.289559,
        high: 1.312735,
        low: 1.287775,
        close: 1.311677,
        volume: 373766.91187741
      },
      {
        time: 1642032000,
        open: 1.309096,
        high: 1.352611,
        low: 1.292594,
        close: 1.297335,
        volume: 618138.68258758
      },
      {
        time: 1642046400,
        open: 1.294276,
        high: 1.314069,
        low: 1.277783,
        close: 1.288364,
        volume: 329096.35951601
      },
      {
        time: 1642060800,
        open: 1.289803,
        high: 1.307233,
        low: 1.274852,
        close: 1.274852,
        volume: 159665.68170449
      },
      {
        time: 1642075200,
        open: 1.27883,
        high: 1.321328,
        low: 1.24985,
        close: 1.269811,
        volume: 299254.69218587
      },
      {
        time: 1642089600,
        open: 1.262846,
        high: 1.277616,
        low: 1.234094,
        close: 1.244604,
        volume: 152918.70985181
      },
      {
        time: 1642104000,
        open: 1.243767,
        high: 1.25136,
        low: 1.227554,
        close: 1.227554,
        volume: 83742.252704
      },
      {
        time: 1642118400,
        open: 1.232122,
        high: 1.251502,
        low: 1.224,
        close: 1.245095,
        volume: 156074.16186114
      },
      {
        time: 1642132800,
        open: 1.245638,
        high: 1.308677,
        low: 1.245245,
        close: 1.285928,
        volume: 385572.77495112
      },
      {
        time: 1642147200,
        open: 1.286638,
        high: 1.288135,
        low: 1.227508,
        close: 1.234079,
        volume: 226354.87883417
      },
      {
        time: 1642161600,
        open: 1.229965,
        high: 1.272681,
        low: 1.221075,
        close: 1.26764,
        volume: 93191.43533269
      },
      {
        time: 1642176000,
        open: 1.268993,
        high: 1.271568,
        low: 1.250465,
        close: 1.261574,
        volume: 61384.05438741
      }
    ]

    input = {
      high: [
        1.435456, 1.418541, 1.405144,  1.39833, 1.375424, 1.332524,
        1.347038, 1.362731, 1.378554, 1.369561, 1.363336,  1.36617,
        1.350297, 1.381088, 1.367522, 1.352703, 1.318714, 1.337816,
        1.336481, 1.331544, 1.337867, 1.348218, 1.378188, 1.381088,
        1.368846, 1.367752, 1.373334, 1.389363, 1.378507, 1.372443,
        1.359096, 1.372177, 1.372481,    1.351, 1.331123, 1.321836,
        1.323492,     1.34, 1.349998, 1.348867, 1.326211, 1.333268,
        1.350297, 1.351444, 1.336952, 1.327046, 1.265426, 1.242955,
        1.231491, 1.222621, 1.246993, 1.253226, 1.295764, 1.281547,
        1.238045, 1.244213, 1.248871, 1.238764, 1.229836,  1.23205,
          1.2411, 1.254813, 1.243148, 1.223678, 1.229388, 1.197306,
        1.192262, 1.181723, 1.169024, 1.205697, 1.205918, 1.179625,
        1.179408, 1.176322, 1.153565, 1.137052, 1.142309, 1.166925,
        1.163435, 1.166351, 1.160586, 1.194497, 1.193994, 1.220462,
         1.21891, 1.255337,  1.28167, 1.294737, 1.312735, 1.352611,
        1.314069, 1.307233, 1.321328, 1.277616,  1.25136, 1.251502,
        1.308677, 1.288135, 1.272681, 1.271568
      ],
      low: [
        1.399077, 1.392701, 1.332589, 1.356307,    1.325, 1.296005,
        1.304904, 1.324996, 1.342072, 1.347891, 1.332087, 1.337093,
          1.3063,  1.32806, 1.349583, 1.281496, 1.290547,  1.31239,
        1.305832, 1.311263, 1.319297, 1.332813, 1.346327, 1.351539,
         1.34378, 1.349583, 1.356307, 1.355059, 1.358867, 1.346681,
        1.345437, 1.348975, 1.351539, 1.326273, 1.311263,  1.29641,
        1.307524, 1.319683, 1.328741, 1.302546, 1.308569, 1.304601,
        1.329929, 1.324462, 1.317677,  1.24561, 1.193608, 1.204546,
        1.197648, 1.193472, 1.186256,  1.22672, 1.249427, 1.202197,
        1.191253, 1.204403,  1.10034, 1.196215, 1.202196, 1.209852,
        1.218892, 1.234867,  1.21136, 1.126725, 1.136005, 1.172988,
        1.172021, 1.152753, 1.147974, 1.158971, 1.168439,  1.15634,
        1.165296,  1.14837,  1.07191, 1.092419, 1.108115, 1.122894,
        1.147652, 1.134578, 1.136609, 1.158794, 1.175722,  1.18701,
        1.199955, 1.202565, 1.245356,     1.27, 1.287775, 1.292594,
        1.277783, 1.274852,  1.24985, 1.234094, 1.227554,    1.224,
        1.245245, 1.227508, 1.221075, 1.259401
      ],
      close: [
        1.399077, 1.409489, 1.399368, 1.359767, 1.329337, 1.309131,
        1.342704, 1.362731, 1.350997, 1.357713, 1.357707, 1.341021,
        1.328405, 1.363137, 1.352558, 1.283953, 1.309469,  1.32421,
        1.323208, 1.322914, 1.333278, 1.346421, 1.378188, 1.354929,
        1.355095, 1.363511,  1.36961, 1.363065, 1.378019, 1.349268,
        1.351552, 1.370283, 1.353138, 1.330861, 1.317407, 1.314422,
        1.323492,     1.34, 1.335206, 1.312684, 1.310902, 1.329592,
        1.339697, 1.324462, 1.327429, 1.255916, 1.228816, 1.204546,
        1.222143, 1.203818, 1.230997, 1.248669, 1.275389,   1.2075,
        1.207294, 1.233536, 1.212774, 1.224932, 1.207556,   1.2258,
        1.238102, 1.237149,  1.21484, 1.142554, 1.181267, 1.174114,
         1.18022, 1.160908, 1.162087, 1.202568,  1.16908, 1.160319,
        1.175674, 1.150634, 1.111935, 1.112884, 1.124325, 1.159231,
        1.154822, 1.144702, 1.159722,  1.18706,  1.18681, 1.220462,
        1.200607, 1.244981, 1.277485, 1.287252, 1.311677, 1.297335,
        1.288364, 1.274852, 1.269811, 1.244604, 1.227554, 1.245095,
        1.285928, 1.234079,  1.26764, 1.261605
      ],
      period: 14,
      signalPeriod: 3
    }
  })


  // 2022-01-18T16:18:59.271Z [debug] STOCHASTIC (4h): [ k: 27.05 | d: 39.01 ] => 0

  it('should be extremely confident as K value is above D, but both are below threshold', () => {
    const k = 30
    const d = 10
    const confidence = mapOutputToConfindence(k, d)
    expect(confidence).toBe(1)
  })

  it('should return high conficence as K is below D', () => {
    const k = 1
    const d = 2
    const confidence = mapOutputToConfindence(k, d)
    expect(confidence).toBe(0.8)
  })

  it('should return some conficence as K value is below D', () => {
    const k = 1
    const d = 5
    const confidence = mapOutputToConfindence(k, d)
    expect(confidence).toBe(0.65)
  })

  it('should return some conficence as K value is way below D', () => {
    const k = 1
    const d = 8
    const confidence = mapOutputToConfindence(k, d)
    expect(confidence).toBe(0.5)
  })

  it('should return some conficence as K value is way below D', () => {
    const k = 27.05
    const d = 39.01
    const confidence = mapOutputToConfindence(k, d)
    expect(confidence).toBe(0.5)
  })

  it('play around with Stoachastic indicator', () => {

    const newInput = {
      high: takeRight(input.high, 50),
      low: takeRight(input.low, 50),
      close: takeRight(input.close, 50),
      period: 14,
      signalPeriod: 3
    }

    expect(newInput.close.length).toBeLessThan(input.close.length)

    // 21 + 25
    const result1 = Stochastic.calculate(input)
    const result2 = Stochastic.calculate(newInput)

    expect(takeRight(result1, 1)['k']).toEqual(takeRight(result2, 1)['k'])
    expect(takeRight(result1, 1)['d']).toEqual(takeRight(result2, 1)['d'])

    // console.log(result1)
    // console.log(result2)
  })

  it('ddd', async () => {

    const data = blocks.reduce((acc: number[][], block, index) => {
      if(block.high && block.close && block.low) {
        // console.log(block)
        const sum = [block.high, block.close, block.low]
        acc.push(sum)
      }
      return acc
    }, [])


    // const newInput = {
    //   high: takeRight(input.high, 4),
    //   low: takeRight(input.low, 4),
    //   close: takeRight(input.close, 4)
    // }

    // console.log(newInput)

    // console.log(data)

    // // var data = [[3,2,1], [2,2,1], [4,3,1], [2,2,1]]; // [high, close, low]
    // var length = 14; // default = 14
    // var smoothd = 3; // default = 3
    // var smoothk = 3; // default = 3
    // const result = await ta.stoch(data, length, smoothd, smoothk);
  
    // console.log(result)
  })

})
